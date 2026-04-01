
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowRight, Truck, ChevronLeft } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useUser();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset failed:", err);
      setError(err.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Link to="/" className="mb-6 flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
            </Link>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Forgot Password?</h2>
              <p className="text-slate-500 mt-2">Enter your email to receive a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="text-center py-4 animate-fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
            <p className="text-slate-500 mb-8">We've sent a password reset link to <span className="font-bold text-slate-800">{email}</span>.</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Return to Login <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
