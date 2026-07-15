import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Mail, Lock, ShieldAlert, ArrowLeft, Key, Check } from 'lucide-react';

export default function ForgotPassword() {
  const { forgotPassword, resetPassword, apiFetch } = useAuth();
  const navigate = useNavigate();
  const [loginBgUrl, setLoginBgUrl] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  React.useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await apiFetch('/api/events');
        if (data.success && data.events.length > 0) {
          const active = data.events.find(e => e.status === 'Active') || data.events[0];
          if (active && active.loginBgUrl) {
            setLoginBgUrl(active.loginBgUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching event in ForgotPassword:', err);
      }
    };
    fetchEvent();
  }, [apiFetch]);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Recovery flow
  const [isResetting, setIsResetting] = useState(false);
  const [userId, setUserId] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await forgotPassword(email);
      if (data.success) {
        setUserId(data.userId);
        setDevOtp(data.devOtp || '');
        setIsResetting(true);
      }
    } catch (err) {
      setError(err.message || 'Error requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otpVal || !newPassword) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await resetPassword(userId, otpVal, newPassword);
      if (data.success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-4rem)] w-full flex items-center bg-cover bg-center relative"
      style={{ backgroundImage: `url('${loginBgUrl || '/login_bg.jpg'}')` }}
    >
      {/* Dark tint overlay without blur */}
      <div className="absolute inset-0 bg-slate-950/15"></div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex justify-center md:justify-start">
        <div className="relative w-full max-w-md bg-white/85 dark:bg-slate-950/75 border border-white/20 dark:border-white/5 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-lg">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img 
            src="/sumbacontest.jpg" 
            alt="SumbaContest Logo" 
            className="h-10 w-auto object-contain rounded-lg"
          />
          <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500">
            {isResetting ? 'Create your new password' : 'Enter email to receive password reset OTP'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-400">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Input Email */}
        {!isResetting ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Send Reset Code
            </button>
          </form>
        ) : (
          /* Step 2: Reset Form */
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Test OTP Code (Development Only)</span>
              <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {devOtp}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Enter 6-Digit OTP</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpVal}
                  onChange={(e) => setOtpVal(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 font-mono tracking-widest text-center"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Update Password
            </button>
            <button
              type="button"
              onClick={() => setIsResetting(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center"
            >
              Go back
            </button>
          </form>
        )}

        <div className="text-center text-xs">
          <Link
            to="/login"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>

        </div>
      </div>

      {/* Success Redirect Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-4 items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center">
              <Check size={24} className="stroke-[3]" />
            </div>
            <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white mt-2">
              Password Reset Successful!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your password has been successfully updated. You are now being redirected to the login page.
            </p>
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mt-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}
