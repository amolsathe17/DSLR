import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, User, Mail, Phone, Lock, Building, ShieldAlert, ArrowRight, ShieldCheck, Key, Calendar, MapPin } from 'lucide-react';

export default function Register() {
  const { register, verifyOtp, requestMobileOtp, verifyMobileOtp, apiFetch } = useAuth();
  const navigate = useNavigate();

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
        console.error('Error fetching event in Register page:', err);
      }
    };
    fetchEvent();
  }, []);

  const [registerMethod, setRegisterMethod] = useState('email'); // 'email' or 'mobile'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('Participant');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP states
  const [isVerifying, setIsVerifying] = useState(false);
  const [userId, setUserId] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpMode, setOtpMode] = useState(''); // 'email-verify' or 'mobile-verify'

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !mobile || !password || !city) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await register(name, email, mobile, password, city, role);
      if (data.success) {
        setUserId(data.userId);
        setDevOtp(data.devOtp || '');
        setOtpMode('email-verify');
        setIsVerifying(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileRegister = async (e) => {
    e.preventDefault();
    if (!name || !mobile || !city) {
      setError('Please enter Name, Mobile, and City');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await requestMobileOtp(mobile, true, name, city, role); // isSignup = true
      if (data.success) {
        setUserId(data.userId);
        setDevOtp(data.devOtp || '');
        setOtpMode('mobile-verify');
        setIsVerifying(true);
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
        if (data.user.role === 'Admin') {
          navigate('/admin');
        } else if (data.user.role === 'Judge') {
          navigate('/judge');
        } else {
          navigate('/dashboard');
        }
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
      style={{ backgroundImage: `url('${event?.loginBgUrl || '/login_bg.jpg'}')` }}
    >
      {/* Dark tint overlay without blur */}
      <div className="absolute inset-0 bg-slate-950/15"></div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-12">
        <div className="relative w-full max-w-lg bg-white/85 dark:bg-slate-950/75 border border-white/20 dark:border-white/5 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-lg shrink-0">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
            {isVerifying ? 'Email Verification' : 'Register to submit entries and track results'}
          </h2>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-400">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!isVerifying ? (
          <div className="flex flex-col gap-5">
            {/* Toggle tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setRegisterMethod('email'); setError(''); }}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  registerMethod === 'email'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-355'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => { setRegisterMethod('mobile'); setError(''); }}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  registerMethod === 'mobile'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-355'
                }`}
              >
                Mobile & OTP
              </button>
            </div>

            {/* Email/Password Signup */}
            {registerMethod === 'email' ? (
              <form onSubmit={handleEmailRegister} className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500">Mobile Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">City</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Create Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  <ShieldCheck size={16} />
                  {loading ? 'Processing...' : 'Register & Verify'}
                </button>
              </form>
            ) : (
              /* Mobile/OTP Signup */
              <form onSubmit={handleMobileRegister} className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">City</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Mobile Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  <Key size={16} />
                  {loading ? 'Sending OTP...' : 'Send Signup OTP'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* OTP verification form */
          <form onSubmit={handleOtpVerify} className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Test OTP Code (Development Only)</span>
              <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {devOtp}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500 text-center">
                We've sent a 6-digit OTP verification code. Please input it below:
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpVal}
                onChange={(e) => setOtpVal(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-mono text-2xl tracking-widest focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Verify Account
            </button>

            <button
              type="button"
              onClick={() => { setIsVerifying(false); setError(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center cursor-pointer"
            >
              Change registration details
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            Login here
            <ArrowRight size={12} />
          </Link>
        </div>

        </div>

        {/* Right Side: Exhibition Event Details in White Text */}
        {event && (
          <div className="hidden md:flex flex-col gap-6 text-white max-w-md bg-slate-950/45 p-8 rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl text-white">
                <Calendar size={28} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-300 font-extrabold tracking-widest">Exhibition Date</p>
                <p className="text-xl font-black font-display text-white">
                  {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/10 rounded-2xl text-white mt-0.5">
                <MapPin size={28} className="text-indigo-400" />
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
