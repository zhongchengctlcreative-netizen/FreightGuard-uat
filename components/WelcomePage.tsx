
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { 
  Truck, User as UserIcon, LogIn, UserPlus, KeyRound, Loader2, 
  AlertCircle, ChevronLeft, Mail, Briefcase, Shield, ArrowRight, 
  CheckCircle, Globe, Anchor, Plane, ChevronDown, Search
} from 'lucide-react';
import ConnectionStatusModal from './ConnectionStatusModal';
import LoginMascot from './LoginMascot';
import { useUser } from '../contexts/UserContext';

const WelcomePage: React.FC = () => {
  const { login, signup, loading } = useUser();
  
  const [view, setView] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [showSettings, setShowSettings] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Mascot State
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'department' | 'role' | 'none'>('none');

  // Signup State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    department: '',
    role: 'REQUESTER' as UserRole,
    password: ''
  });

  const { resetPassword } = useUser();

  // Mascot Greeting Logic
  const mascotMessage = useMemo(() => {
    if (error) return "Uh oh!";
    if (signupSuccess) return "Welcome!";
    if (resetSent) return "Check email!";
    if (view === 'forgot-password') return "We'll help!";
    if (view === 'signup') return "Join us!";
    if (focusedField === 'password') return "Don't peek!";
    if (email) return "Hello!";
    return undefined; 
  }, [error, signupSuccess, resetSent, view, focusedField, email]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email) {
      setError("Please enter your email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      console.error("Reset failed:", err);
      setError(err.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
        setError("Email and Password are required.");
        setIsSubmitting(false);
        return;
    }

    try {
        await login(email, password);
    } catch (err: any) {
        console.error("Login failed:", err);
        setError(err.message || "Invalid email or password.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!signupData.name || !signupData.email || !signupData.password) {
        setError("Name, Email, and Password are required.");
        setIsSubmitting(false);
        return;
    }

    if (signupData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        setIsSubmitting(false);
        return;
    }

    try {
        await signup({
            name: signupData.name,
            email: signupData.email,
            department: signupData.department,
            role: signupData.role,
            status: 'INACTIVE', // New users are inactive by default
        }, signupData.password);
        setSignupSuccess(true);
    } catch (err: any) {
        console.error("Signup failed:", err);
        if (err.message && (err.message.includes('Database Schema Mismatch') || err.message.includes('check constraint'))) {
             setError(err.message);
        } else {
             setError(err.message || "Failed to create account. Please try again.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const resetSignup = () => {
      setSignupSuccess(false);
      setView('login');
      setSignupData({
        name: '',
        email: '',
        department: '',
        role: 'REQUESTER',
        password: ''
      });
      setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans text-slate-900">
      
      {/* Left Panel: Branding & Visuals (Hidden on small mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background Gradients & Patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 opacity-90 z-0"></div>
        <div className="absolute inset-0 opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        {/* Abstract Floating Elements */}
        <div className="absolute top-1/4 right-1/4 p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 rotate-12 animate-pulse">
            <Globe size={48} className="text-indigo-400 opacity-80" />
        </div>
        <div className="absolute bottom-1/3 left-10 p-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 -rotate-6">
            <Anchor size={32} className="text-cyan-400 opacity-80" />
        </div>
        <div className="absolute top-20 left-20 p-2 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 rotate-45">
            <Plane size={24} className="text-emerald-400 opacity-80" />
        </div>

        {/* Content */}
        <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 mb-6">
                <Truck size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">FreightGuard <span className="text-indigo-400">Approval System</span></h1>
            <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                Streamline your global logistics operations with AI-powered risk assessment, secure approval workflows, and real-time cost analysis.
            </p>
        </div>

        <div className="relative z-10 mt-auto">
            <div className="mt-8 text-xs text-slate-500">
                &copy; 2025 FreightGuard Inc. All rights reserved.
            </div>
        </div>
      </div>

      {/* Right Panel: Authentication Forms */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 relative bg-white overflow-y-auto">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="lg:hidden absolute top-8 left-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Truck size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">FreightGuard</span>
        </div>

        <div className="w-full max-w-md space-y-4 animate-card-fly-in">
            
            {/* Mascot Component */}
            <LoginMascot 
                focusedField={focusedField} 
                hasError={!!error} 
                isSuccess={signupSuccess}
                message={mascotMessage}
            />

            {/* View: Login */}
            {view === 'login' && (
                <div className="animate-fade-in pt-4">
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500 mt-2">Sign in to access your dashboard.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Email Address</label>
                            <div className="relative group">
                                <input 
                                    type="email" 
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-800 transition-all group-hover:bg-slate-100"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField('none')}
                                />
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 bg-white rounded-md shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <Mail size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Password</label>
                            <div className="relative group">
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-800 transition-all group-hover:bg-slate-100"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField('none')}
                                />
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 bg-white rounded-md shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <KeyRound size={16} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    type="button"
                                    onClick={() => { setView('forgot-password'); setError(''); }}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-sm text-red-700 animate-fade-in">
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Access Dashboard <LogIn size={18} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => { setView('signup'); setError(''); }}
                            className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 mx-auto group"
                        >
                            New User? <span className="underline decoration-slate-300 group-hover:decoration-indigo-600 underline-offset-4">Create Account</span>
                        </button>
                    </div>
                </div>
            )}

            {/* View: Forgot Password */}
            {view === 'forgot-password' && (
                <div className="animate-fade-in pt-4">
                    <button onClick={() => { setView('login'); setResetSent(false); setError(''); }} className="mb-6 flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
                    </button>

                    {!resetSent ? (
                        <>
                            <div className="mb-6 text-center">
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Forgot Password?</h2>
                                <p className="text-slate-500 mt-2">Enter your email to receive a reset link.</p>
                            </div>

                            <form onSubmit={handleResetSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Email Address</label>
                                    <div className="relative group">
                                        <input 
                                            type="email" 
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-800 transition-all group-hover:bg-slate-100"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField('none')}
                                        />
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 bg-white rounded-md shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                                            <Mail size={16} />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-sm text-red-700 animate-fade-in">
                                        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Send Reset Link"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8 animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">Check Your Email</h2>
                            <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
                                We've sent a password reset link to <span className="font-bold text-slate-800">{email}</span>.
                            </p>
                            <button 
                                onClick={() => { setView('login'); setResetSent(false); }}
                                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                Return to Login <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* View: Signup */}
            {view === 'signup' && !signupSuccess && (
                <div className="animate-fade-in pt-4">
                    <button onClick={() => setView('login')} className="mb-6 flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
                    </button>
                    
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create Account</h2>
                        <p className="text-slate-500 mt-2">Request access to the system.</p>
                    </div>

                    <form onSubmit={handleSignupSubmit} className="space-y-5">
                        <div className="relative group">
                            <input 
                                required
                                type="text" 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all group-hover:bg-slate-100"
                                placeholder="Full Name"
                                value={signupData.name}
                                onChange={e => setSignupData({...signupData, name: e.target.value})}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField('none')}
                            />
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
                        </div>

                        <div className="relative group">
                            <input 
                                required
                                type="email" 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all group-hover:bg-slate-100"
                                placeholder="Email Address"
                                value={signupData.email}
                                onChange={e => setSignupData({...signupData, email: e.target.value})}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField('none')}
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div className="relative group">
                                <select 
                                    className="w-full pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none text-sm font-medium text-slate-600 transition-all group-hover:bg-slate-100 cursor-pointer"
                                    value={signupData.role}
                                    onChange={e => setSignupData({...signupData, role: e.target.value as UserRole})}
                                    onFocus={() => setFocusedField('role')}
                                    onBlur={() => setFocusedField('none')}
                                >
                                    <option value="REQUESTER">Requester</option>
                                    <option value="APPROVER">Approver</option>
                                    <option value="LOGISTICS">Logistics</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
                             </div>
                             
                             <div className="relative group">
                                <input 
                                    type="text" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all group-hover:bg-slate-100"
                                    placeholder="Department"
                                    value={signupData.department}
                                    onChange={e => setSignupData({...signupData, department: e.target.value})}
                                    onFocus={() => setFocusedField('department')}
                                    onBlur={() => setFocusedField('none')}
                                />
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
                             </div>
                        </div>

                        <div className="relative group">
                            <input 
                                required
                                type="password" 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all group-hover:bg-slate-100"
                                placeholder="Create Password (min 6 chars)"
                                value={signupData.password}
                                onChange={e => setSignupData({...signupData, password: e.target.value})}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('none')}
                            />
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex flex-col gap-2 text-xs text-red-600 animate-fade-in">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Register Account <UserPlus size={18} /></>}
                        </button>
                    </form>
                </div>
            )}

            {/* View: Signup Success */}
            {view === 'signup' && signupSuccess && (
                 <div className="text-center animate-fade-in py-8">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Registration Complete!</h2>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
                        Your account has been created successfully.<br/>
                        <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded text-sm mt-2 inline-block border border-amber-100">Pending Activation</span>
                    </p>
                    <button 
                        onClick={resetSignup}
                        className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        Return to Login <ArrowRight size={18} />
                    </button>
                 </div>
            )}
        </div>
      </div>
      
      {showSettings && (
        <ConnectionStatusModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default WelcomePage;
