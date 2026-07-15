import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, LogIn, Mail, Lock, ShieldAlert, ArrowRight, Phone, Key, Calendar, MapPin } from 'lucide-react';

export default function Login() {
  const { login, verifyOtp, requestMobileOtp, verifyMobileOtp, apiFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await apiFetch('/api/events');
        if (data.success && data.events.length > 0) {
          const active = data.events.find(e => e.status === 'Active') || data.events[0];
          setEvent(active);
        }
      } catch (err) {
        console.error('Error fetching event in Login page:', err);
      }
    };
    fetchEvent();
  }, []);

  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP states (used for both email verification follow-up and mobile login verification)
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpVal, setOtpVal] = useState('');
  const [userId, setUserId] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpMode, setOtpMode] = useState(''); // 'email-verify' or 'mobile-verify'

  const redirectPath = location.state?.from?.pathname || '/';

  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    if (redirectPath === '/admin') {
      setIsAdminMode(true);
    }
  }, [redirectPath]);

  const primaryBg = isAdminMode ? 'bg-amber-600' : 'bg-indigo-600';
  const primaryHoverBg = isAdminMode ? 'hover:bg-amber-700' : 'hover:bg-indigo-700';
  const primaryText = isAdminMode ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400';
  const primaryFocusBorder = isAdminMode ? 'focus:border-amber-600 dark:focus:border-amber-400' : 'focus:border-indigo-600 dark:focus:border-indigo-400';
  const primaryBorderColor = isAdminMode ? 'border-amber-500/35 dark:border-amber-500/20 shadow-amber-500/5' : 'border-white/20 dark:border-white/5';

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      if (data?.success) {
        navigate(
          data.user.role === 'Judge'
            ? '/judge'
            : (redirectPath === '/'
                ? (data.user.role === 'Admin' ? '/admin' : '/dashboard')
                : redirectPath)
        );
      }
    } catch (err) {
      if (err.message.includes('verification') || err.message.includes('not verified')) {
        // Fetch unverified login payload directly to get OTP
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.requiresVerification) {
          setRequiresOtp(true);
          setUserId(data.userId);
          setDevOtp(data.devOtp || '');
          setOtpMode('email-verify');
          setError('Email not verified. Please verify using the OTP sent.');
        } else {
          setError(data.message || 'Invalid credentials');
        }
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (!mobile) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await requestMobileOtp(mobile, false); // isSignup = false
      if (data.success) {
        setRequiresOtp(true);
        setUserId(data.userId);
        setDevOtp(data.devOtp || '');
        setOtpMode('mobile-verify');
      }
    } catch (err) {
      setError(err.message || 'Mobile OTP request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpVal) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let data;
      if (otpMode === 'mobile-verify') {
        data = await verifyMobileOtp(userId, otpVal);
      } else {
        data = await verifyOtp(userId, otpVal);
      }

      if (data.success) {
        navigate(
          data.user.role === 'Judge'
            ? '/judge'
            : (redirectPath === '/'
                ? (data.user.role === 'Admin' ? '/admin' : '/dashboard')
                : redirectPath)
        );
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-4rem)] w-full flex items-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/login_bg.jpg')" }}
    >
      {/* Dark tint overlay without blur */}
      <div className="absolute inset-0 bg-slate-950/15"></div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-12">
        <div className={`relative w-full max-w-md bg-white/85 dark:bg-slate-950/75 border rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-lg shrink-0 ${primaryBorderColor}`}>
        
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className={`p-2.5 rounded-xl text-white ${primaryBg}`}>
            <Camera size={22} />
          </div>
          <h2 
            onClick={() => setIsAdminMode(!isAdminMode)} 
            className="font-display font-extrabold text-xl text-slate-900 dark:text-white cursor-pointer select-none hover:opacity-85 transition-opacity"
            title="Click to toggle Admin Portal"
          >
            {isAdminMode ? 'Admin Login' : 'SumbaContest Login'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAdminMode ? 'Access your administrator control panel' : 'Access your event participant dashboard'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-200">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form area */}
        {!requiresOtp ? (
          <div className="flex flex-col gap-5">
            {/* Toggle tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setLoginMethod('email'); setError(''); }}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('mobile'); setError(''); }}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  loginMethod === 'mobile'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                Mobile & OTP
              </button>
            </div>

            {/* Email/Password Form */}
            {loginMethod === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none ${primaryFocusBorder}`}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500">Password</label>
                    <Link
                      to="/forgot-password"
                      className={`text-xs hover:underline ${primaryText}`}
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none ${primaryFocusBorder}`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-semibold py-2.5 rounded-xl shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2 ${primaryBg} ${primaryHoverBg}`}
                >
                  <LogIn size={16} />
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            ) : (
              /* Mobile/OTP Form */
              <form onSubmit={handleMobileSubmit} className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Registered Mobile Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none ${primaryFocusBorder}`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-semibold py-2.5 rounded-xl shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2 ${primaryBg} ${primaryHoverBg}`}
                >
                  <Key size={16} />
                  {loading ? 'Sending OTP...' : 'Send Login OTP'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* OTP verification code form */
          <form onSubmit={handleOtpVerify} className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className={`border rounded-2xl p-4 flex flex-col gap-1 ${isAdminMode ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-250/20' : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'}`}>
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Test OTP Code (Development Only)</span>
              <span className={`font-mono text-lg font-bold tracking-wider ${primaryText}`}>
                {devOtp}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 text-center">
                Enter the 6-digit OTP code to verify and log in
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpVal}
                onChange={(e) => setOtpVal(e.target.value)}
                placeholder="123456"
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-mono text-lg tracking-widest focus:outline-none ${primaryFocusBorder}`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer ${primaryBg} ${primaryHoverBg}`}
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => { setRequiresOtp(false); setError(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center cursor-pointer"
            >
              Back to Login
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 mt-2">
          Don't have an account?{' '}
          <Link
            to="/register"
            className={`font-semibold hover:underline inline-flex items-center gap-0.5 ${primaryText}`}
          >
            Register here
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="text-center text-xs text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
          {isAdminMode ? (
            <button
              type="button"
              onClick={() => setIsAdminMode(false)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              Back to Contestant Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdminMode(true)}
              className="text-amber-600 dark:text-amber-500 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              Admin Portal Login
            </button>
          )}
        </div>

        </div>

        {/* Right Side: Exhibition Event Details in White Text */}
        {event && (
          <div className="hidden md:flex flex-col gap-6 text-white max-w-md bg-slate-950/45 p-8 rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl text-white">
                <Calendar size={28} className={isAdminMode ? 'text-amber-500' : 'text-indigo-400'} />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-300 font-extrabold tracking-widest">Exhibition Schedule</p>
                <p className="text-sm font-black font-display text-white">
                  {event.hasExhibition && event.exhibitionFromDate && event.exhibitionToDate ? (
                    `${new Date(event.exhibitionFromDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} - ${new Date(event.exhibitionToDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                  ) : event.hasExhibition && event.exhibitionFromDate ? (
                    `Starts ${new Date(event.exhibitionFromDate).toLocaleDateString(undefined, { dateStyle: 'long' })}`
                  ) : (
                    new Date(event.eventDate || event.deadline).toLocaleDateString(undefined, { dateStyle: 'long' })
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/10 rounded-2xl text-white mt-0.5">
                <MapPin size={28} className="text-indigo-450" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-300 font-extrabold tracking-widest">Exhibition Venue</p>
                <p className="text-sm font-semibold leading-relaxed text-white">
                  {event.venue || 'Bal-Gandharv Art Gallery, Jangali Maharaj Road, Pune 411030'}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-2">
              <p className="text-xs text-slate-300/80 leading-relaxed font-medium">
                National DSLR Wildlife & Landscape Championship. Submissions are active until July 15, 2026.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
