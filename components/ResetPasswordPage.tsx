
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { KeyRound, Loader2, AlertCircle, CheckCircle, ArrowRight, Truck } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const { updatePassword, loading: authLoading, currentUser } = useUser();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user is authenticated (recovery session should be active)
  useEffect(() => {
    if (!authLoading && !currentUser && !success) {
      setError("No active reset session found. Please use the link from your email.");
    }
  }, [authLoading, currentUser, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err: any) {
      console.error("Password update failed:", err);
      setError(err.message || "Failed to update password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-card-fly-in">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Truck size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">FreightGuard</span>
        </div>

        {!success ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-slate-500 mt-2">Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">New Password</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-800 transition-all group-hover:bg-slate-100"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 bg-white rounded-md shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <KeyRound size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Confirm Password</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-800 transition-all group-hover:bg-slate-100"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 bg-white rounded-md shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <KeyRound size={16} />
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
                disabled={isSubmitting || (!currentUser && !success)}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Updated</h2>
            <p className="text-slate-500 mb-8">Your password has been changed successfully. You can now log in with your new credentials.</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Go to Login <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
