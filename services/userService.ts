
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User } from '../types';

const USERS_STORAGE_KEY = 'freightguard_users_v2';

// Initial Default Data
const DEFAULT_USERS: User[] = [
  { 
    id: '1', 
    name: 'JOHN DOE', 
    email: 'john.doe@freightguard.com', 
    role: 'REQUESTER', 
    department: 'Logistics', 
    status: 'ACTIVE', 
    lastLogin: '2024-05-20 09:00',
    passcode: '1234'
  },
  { 
    id: '2', 
    name: 'JANE SMITH', 
    email: 'jane.smith@freightguard.com', 
    role: 'APPROVER', 
    department: 'Finance', 
    status: 'ACTIVE', 
    lastLogin: '2024-05-21 10:30',
    passcode: '1234'
  },
  { 
    id: '3', 
    name: 'ADMIN USER', 
    email: 'admin@freightguard.com', 
    role: 'ADMIN', 
    department: 'IT', 
    status: 'ACTIVE', 
    lastLogin: '2024-05-22 08:15',
    passcode: '8888'
  },
  { 
    id: '4', 
    name: 'SARAH CONNOR', 
    email: 'sarah.c@freightguard.com', 
    role: 'APPROVER', 
    department: 'Operations', 
    status: 'INACTIVE', 
    lastLogin: '2024-04-10 14:20',
    passcode: '1234'
  }
];

// Helper to load from LocalStorage
const loadLocalUsers = (): User[] => {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure we respect empty arrays (user deleted all)
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load users from storage", e);
  }
  return DEFAULT_USERS;
};

// Helper to save to LocalStorage
const saveLocalUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save users to storage", e);
  }
};

let isUsingMockDataState = false;

// Helper to handle Supabase specific errors
const handleSupabaseError = (error: any) => {
    if (error?.code === '23514' || (error?.message && error.message.includes('app_users_role_check'))) {
        throw new Error("Database Schema Mismatch: The 'role' value is not allowed by the current database constraints. Please go to Settings > System Config and run the SQL Schema update script to fix this.");
    }
    // Propagate original error message if it exists
    throw new Error(error.message || "Database operation failed");
};

export const userService = {
  isUsingMockData: () => isUsingMockDataState,

  async getAllUsers(): Promise<User[]> {
    // 1. Always load local state first (as backup)
    const localUsers = loadLocalUsers();

    if (!isSupabaseConfigured) {
      isUsingMockDataState = true;
      // Simulate slight network delay for realism
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...localUsers];
    }
    
    try {
      const { data, error } = await supabase.from('app_users').select('*');
      
      if (error) {
          console.warn("Supabase fetch failed, falling back to local users.", JSON.stringify(error, null, 2));
          isUsingMockDataState = true;
          return [...localUsers];
      }
      
      isUsingMockDataState = false;
      
      const dbUsers = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name?.toUpperCase(),
        email: u.email,
        role: u.role,
        department: u.department,
        status: u.status,
        lastLogin: u.last_login || u.lastLogin,
        passcode: u.passcode
      })) as User[];

      // STRICT MODE: When DB is connected, only return DB users.
      // We do NOT merge local users here anymore to prevent phantom/mock users from appearing.
      return dbUsers;

    } catch (e) {
      console.warn("Error in user service", e);
      isUsingMockDataState = true;
      return [...localUsers];
    }
  },

  async getUserById(id: string): Promise<User | null> {
    if (!isSupabaseConfigured) {
      const localUsers = loadLocalUsers();
      return localUsers.find(u => u.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name?.toUpperCase(),
        email: data.email,
        role: data.role,
        department: data.department,
        status: data.status,
        lastLogin: data.last_login || data.lastLogin,
        passcode: data.passcode
      } as User;
    } catch (e) {
      console.warn("Error fetching user by ID", e);
      return null;
    }
  },

  async findByEmail(email: string): Promise<User | null> {
    if (!isSupabaseConfigured) {
      const localUsers = loadLocalUsers();
      return localUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name?.toUpperCase(),
        email: data.email,
        role: data.role,
        department: data.department,
        status: data.status,
        lastLogin: data.last_login || data.lastLogin,
        passcode: data.passcode
      } as User;
    } catch (e) {
      console.warn("Error fetching user by email", e);
      return null;
    }
  },

  async createUser(user: Omit<User, 'id' | 'lastLogin'>, explicitId?: string): Promise<User> {
    if (!user.name || !user.email) throw new Error("Name and Email are required");
    
    const upperName = user.name.toUpperCase();

    // Use explicitId if provided (from Supabase Auth), otherwise generate a temporary one
    const id = explicitId || `PENDING_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newUser: User = {
      ...user,
      name: upperName,
      id,
      lastLogin: '-'
    };

    if (!isSupabaseConfigured) {
      // MOCK MODE: Save to local storage
      const currentLocal = loadLocalUsers();
      // Check for duplicates by email
      if (!currentLocal.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
          const updatedLocal = [...currentLocal, newUser];
          saveLocalUsers(updatedLocal);
      }
      isUsingMockDataState = true;
      return newUser;
    }

    // STRICT DB MODE: Direct insert only
    try {
        const payload = {
          id,
          name: upperName,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status || 'INACTIVE', // Ensure default status
          passcode: user.passcode,
          last_login: null
        };

        // Check if user with this email already exists (Pre-provisioned by Admin)
        const { data: existing } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (existing) {
            // Update existing record with the new Auth ID
            const { data: updated, error: updateError } = await supabase
                .from('app_users')
                .update({ 
                    id, 
                    name: upperName,
                    role: user.role,
                    department: user.department,
                    status: user.status || 'ACTIVE'
                })
                .eq('email', user.email)
                .select()
                .single();
            
            if (updateError) {
                console.error("Supabase update-on-create failed:", JSON.stringify(updateError, null, 2));
                handleSupabaseError(updateError);
            }
            
            return {
                id: updated.id,
                name: updated.name?.toUpperCase(),
                email: updated.email,
                role: updated.role,
                department: updated.department,
                status: updated.status,
                passcode: updated.passcode,
                lastLogin: updated.last_login
            } as User;
        }

        // Attempt DB Insert if no existing record
        const { data, error } = await supabase.from('app_users').insert([payload]).select().single();
        
        if (error) {
            console.error("Supabase insert failed:", JSON.stringify(error, null, 2));
            handleSupabaseError(error);
        }
        
        // Return DB version
        return {
          id: data.id,
          name: data.name?.toUpperCase(),
          email: data.email,
          role: data.role,
          department: data.department,
          status: data.status,
          passcode: data.passcode,
          lastLogin: data.last_login
        } as User;

    } catch (e) {
        console.error("Create User Error:", e);
        throw e; // Propagate error so the UI handles it correctly
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    if (!id) throw new Error("User ID is required");

    // Standardize Name to Uppercase
    const finalUpdates = { ...updates };
    if (finalUpdates.name) {
        finalUpdates.name = finalUpdates.name.toUpperCase();
    }

    if (!isSupabaseConfigured) {
        // MOCK MODE
        const currentLocal = loadLocalUsers();
        const updatedLocal = currentLocal.map(u => u.id === id ? { ...u, ...finalUpdates } : u);
        saveLocalUsers(updatedLocal);
        return;
    }

    // STRICT DB MODE
    try {
        const payload: any = { ...finalUpdates };
        if (updates.lastLogin) {
            payload.last_login = updates.lastLogin;
            delete payload.lastLogin;
        }

        const { error } = await supabase.from('app_users').update(payload).eq('id', id);
        if (error) {
            console.error("Supabase update error:", JSON.stringify(error, null, 2));
            handleSupabaseError(error);
        }
    } catch (e) {
        console.warn("Supabase update failed.", e);
        throw e;
    }
  },

  async deleteUser(id: string): Promise<void> {
    if (!id) throw new Error("User ID is required");

    if (!isSupabaseConfigured) {
        // MOCK MODE
        const currentLocal = loadLocalUsers();
        const updatedLocal = currentLocal.filter(u => u.id !== id);
        saveLocalUsers(updatedLocal);
        return;
    }

    // STRICT DB MODE
    try {
        const { error } = await supabase.from('app_users').delete().eq('id', id);
        if (error) {
            console.error("Supabase delete error:", JSON.stringify(error, null, 2));
            handleSupabaseError(error);
        }
    } catch (e) {
        console.warn("Supabase delete failed.", e);
        throw e;
    }
  }
};
