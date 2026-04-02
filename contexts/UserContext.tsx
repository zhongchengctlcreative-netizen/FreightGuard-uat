
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { userService } from '../services/userService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  isPasswordRecoveryFlow: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id' | 'lastLogin'>, password: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecoveryFlow, setIsPasswordRecoveryFlow] = useState(false);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  }, []);

  // Sync profile data for the authenticated user
  const syncUserProfile = useCallback(async (supabaseUser: any) => {
    if (!supabaseUser) {
      setCurrentUser(null);
      return;
    }

    try {
      let profile = await userService.getUserById(supabaseUser.id);
      
      // If profile exists but is missing data (e.g. created by trigger), update it
      if (profile) {
          const updates: Partial<User> = {};
          if ((!profile.name || profile.name === 'USER') && supabaseUser.user_metadata?.full_name) {
              updates.name = supabaseUser.user_metadata.full_name;
          }
          if (!profile.department && supabaseUser.user_metadata?.department) {
              updates.department = supabaseUser.user_metadata.department;
          }
          if (profile.role === 'REQUESTER' && supabaseUser.user_metadata?.role && supabaseUser.user_metadata.role !== 'REQUESTER') {
              updates.role = supabaseUser.user_metadata.role;
          }
          
          if (Object.keys(updates).length > 0) {
              try {
                  await userService.updateUser(profile.id, updates);
                  profile = { ...profile, ...updates };
              } catch (updateErr) {
                  console.warn("Failed to sync missing profile data:", updateErr);
              }
          }
          setCurrentUser(profile);
      } else {
        // If profile doesn't exist in app_users but user is authed, 
        // create it to ensure sync between auth.users and app_users.
        try {
          const newUser = await userService.createUser({
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0].toUpperCase() || 'USER',
            email: supabaseUser.email || '',
            role: supabaseUser.user_metadata?.role || 'REQUESTER',
            department: supabaseUser.user_metadata?.department || 'Unknown',
          }, supabaseUser.id);
          setCurrentUser(newUser);
        } catch (createErr) {
          console.error("Failed to create missing profile data:", createErr);
          // Fallback to basic user object if creation fails
          setCurrentUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0].toUpperCase() || 'USER',
            role: supabaseUser.user_metadata?.role || 'REQUESTER',
            department: supabaseUser.user_metadata?.department || 'Unknown',
            lastLogin: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error syncing user profile:", error);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await syncUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecoveryFlow(true);
      }

      if (session?.user) {
        syncUserProfile(session.user);
      } else {
        setCurrentUser(null);
        if (event === 'SIGNED_OUT') {
          setIsPasswordRecoveryFlow(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Mock login for development without Supabase
      const allUsers = await userService.getAllUsers();
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        setCurrentUser(user);
      } else {
        throw new Error("User not found in mock data");
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session?.user) {
      await syncUserProfile(data.session.user);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured. Password reset is unavailable in local mode.");
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?recovery=true`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  const signup = async (userData: Omit<User, 'id' | 'lastLogin'>, password: string) => {
    if (!isSupabaseConfigured) {
      await userService.createUser(userData);
      await refreshUsers();
      return;
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: {
        data: {
          full_name: userData.name,
          department: userData.department,
          role: userData.role,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Signup failed: No user returned");

    // 2. Create Profile in app_users
    try {
      await userService.createUser(userData, authData.user.id);
      await refreshUsers();
    } catch (profileError) {
      console.error("Auth user created but profile creation failed:", profileError);
      // You might want to delete the auth user here if profile creation fails,
      // but Supabase doesn't make that easy from the client.
      throw profileError;
    }
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      users, 
      loading, 
      isPasswordRecoveryFlow,
      login, 
      logout, 
      resetPassword, 
      updatePassword, 
      signup, 
      refreshUsers 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
