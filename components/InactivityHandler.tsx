
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { LogOut, Clock, AlertCircle } from 'lucide-react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 60 * 1000; // 1 minute warning

const InactivityHandler: React.FC = () => {
  const { currentUser, logout } = useUser();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_BEFORE / 1000);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);
    setTimeLeft(WARNING_BEFORE / 1000);

    if (currentUser) {
      // Set the warning timer
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        startCountdown();
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

      // Set the final logout timer
      timerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [currentUser, logout]);

  const startCountdown = () => {
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    if (currentUser) {
      resetTimers();
      events.forEach(event => window.addEventListener(event, handleActivity));
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentUser, resetTimers, showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <Clock className="text-amber-600 animate-pulse" size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">Session Expiring Soon</h3>
          <p className="text-slate-600 mb-8">
            You have been inactive for a while. For your security, you will be automatically logged out in:
          </p>
          
          <div className="text-5xl font-black text-indigo-600 mb-8 tabular-nums">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={logout}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Log Out
            </button>
            <button
              onClick={resetTimers}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityHandler;
