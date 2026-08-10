import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, getEventFallbackImage } from '../utils/url';
import { Camera, User, Mail, Phone, Lock, Building, ShieldAlert, ArrowRight, ShieldCheck, Key, Calendar, MapPin, Clock, RotateCcw, Info } from 'lucide-react';

export default function Register() {
  const { user, register, verifyOtp, requestMobileOtp, verifyMobileOtp, apiFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isFlipped, setIsFlipped] = useState(!location.state?.fromLogin);

  // 2-second automatic flip ONLY on initial page load (Information Card -> Register Form Card)
  useEffect(() => {
    if (!location.state?.fromLogin) {
      const timer = setTimeout(() => {
        setIsFlipped(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.state?.fromLogin]);

  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        navigate('/admin');
      } else if (user.role === 'Judge') {
        navigate('/judge');
      } else {
        if (location.state?.eventId) {
          localStorage.setItem(`selectedEventId_${user.role}`, location.state.eventId);
        }
        navigate('/dashboard', { state: { eventId: location.state?.eventId } });
      }
    }
  }, [user, navigate, location.state?.eventId]);

  const [event, setEvent] = useState(location.state?.event || null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await apiFetch('/api/events');
        if (data.success && data.events.length > 0) {
          const targetId = location.state?.eventId || localStorage.getItem('selectedEventId_Participant') || localStorage.getItem('selectedEventId');
          let selected = null;
          if (targetId) {
            selected = data.events.find(e => e._id === targetId);
          }
          if (!selected && location.state?.event) {
            selected = location.state.event;
          }
          if (!selected) {
            selected = data.events.find(e => e.status === 'Active') || data.events[0];
          }
          setEvent(selected);
        }
      } catch (err) {
        console.error('Error fetching event in Register page:', err);
      }
    };
    fetchEvent();
  }, [location.state?.eventId]);

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
    if (event?.gradingConfirmed) {
      setError('Registrations are closed for this event.');
      return;
    }
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
    if (event?.gradingConfirmed) {
      setError('Registrations are closed for this event.');
      return;
    }
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

  if (event?.gradingConfirmed) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-6 text-center text-white bg-slate-950 relative">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl items-center">
          <div className="p-4 bg-red-955/40 text-red-500 rounded-2xl border border-red-900/30">
            <ShieldAlert size={36} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Registrations Closed</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              The jury panel has finalized grading and signed off on the results for this event. Registrations are no longer accepted.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 font-bold"
          >
            Go to Login <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div 
      className="min-h-[calc(100vh-4rem)] w-full flex items-center bg-cover bg-center relative login-bg-responsive"
      style={{
        '--login-bg': `url('${getBackendUrl(getEventFallbackImage(event))}')`
      }}
    >
      <style>{`
        @media (min-width: 640px) {
          .login-bg-responsive {
            background-image: var(--login-bg) !important;
          }
        }
        @media (max-width: 639px) {
          .login-bg-responsive {
            background-image: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%) !important;
          }
        }
      `}</style>
      {/* DEADLINE BLOCK MODAL */}
      {event && new Date(event.deadline) < new Date() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-500 text-3xl font-bold">
              🛑
            </div>
            <h2 className="font-display font-black text-xl text-slate-900 dark:text-white">
              Submission Deadline Passed
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              The submission deadline for this contest has passed. Registration and contestant entry submissions are closed for this event.
            </p>
            <Link
              to="/login"
              state={{ forceJudge: true }}
              className="mt-2 w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer font-bold"
            >
              Go to Judge/Admin Portal
            </Link>
          </div>
        </div>
      )}
      {/* Dark tint overlay without blur */}
      <div className="absolute inset-0 bg-slate-950/15"></div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
        {/* 3D Flip Card Container */}
        <div className="w-full max-w-lg mx-auto [perspective:1200px] relative">
          <div
            className={`w-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] relative ${
              isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
            }`}
          >
            {/* SIDE A: Register Form Card (Front Face) */}
            <div
              className="w-full bg-white/20 dark:bg-slate-950/35 border border-white/30 dark:border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-5 backdrop-blur-xl relative [backface-visibility:hidden]"
            >
              {/* Top Bar with Brand Header & Semi-Transparent Info Control Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white leading-tight">
                    {isVerifying ? 'Email Verification' : 'Register to submit entries and track results'}
                  </h2>
                </div>

                {/* Semi-transparent Top-Right Info Control Button */}
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/40 hover:bg-white/70 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer border border-white/50 dark:border-slate-700/50 backdrop-blur-md mt-0.5"
                  title="View Contest Event Information"
                >
                  <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-extrabold">Info</span>
                </button>
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
                        <label className="text-xs font-semibold text-white">Email Address</label>
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

                      <div className="flex justify-center">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-fit px-8 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                        >
                          <ShieldCheck size={16} />
                          {loading ? 'Processing...' : 'Register & Verify'}
                        </button>
                      </div>
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

                      <div className="flex justify-center">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-fit px-8 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                        >
                          <Key size={16} />
                          {loading ? 'Sending OTP...' : 'Send Signup OTP'}
                        </button>
                      </div>
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

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-fit px-8 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      Verify Account
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIsVerifying(false); setError(''); }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center cursor-pointer"
                  >
                    Change registration details
                  </button>
                </form>
              )}

              <div className="text-center text-xs text-white">
                Already have an account?{' '}
                <Link
                  to="/login"
                  state={{ fromRegister: true }}
                  className="font-semibold text-white hover:text-black transition-colors hover:underline inline-flex items-center gap-0.5"
                >
                  Login here
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* SIDE B: Information Card (Back Face) */}
            <div
              className="w-full min-h-[460px] h-full absolute inset-0 bg-slate-950/45 text-white p-6 sm:p-8 rounded-3xl border border-white/20 backdrop-blur-xl shadow-2xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] z-10 overflow-y-auto"
            >
              {/* Top-Right Flip Control Button to Return to Form Card */}
              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className="absolute top-5 right-5 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shadow-sm cursor-pointer border border-white/20 backdrop-blur-md"
                title="Back to Registration Form"
              >
                <RotateCcw size={14} className="text-indigo-400" />
                <span className="text-[11px] font-extrabold">Form</span>
              </button>

              <div className="flex flex-col gap-6 my-auto pt-2">
                {/* Block 1: Submission Deadline */}
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-white/10 rounded-2xl text-white shrink-0">
                    <Clock size={28} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-300 font-extrabold tracking-widest">SUBMISSION DEADLINE</p>
                    <p className="text-sm sm:text-base font-black font-display text-white mt-0.5">
                      {event ? new Date(event.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '17 September 2026'}
                    </p>
                  </div>
                </div>

                {/* Block 2: Exhibition Date */}
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-white/10 rounded-2xl text-white shrink-0">
                    <Calendar size={28} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-300 font-extrabold tracking-widest">EXHIBITION DATE</p>
                    <p className="text-sm sm:text-base font-black font-display text-white mt-0.5">
                      {event?.exhibitionFromDate ? (
                        new Date(event.exhibitionFromDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      ) : event?.eventDate ? (
                        new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      ) : (
                        '20 September 2026'
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Block 3: Exhibition Venue */}
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-white/10 rounded-2xl text-white shrink-0 mt-0.5">
                    <MapPin size={28} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-300 font-extrabold tracking-widest">EXHIBITION VENUE</p>
                    <p className="text-xs sm:text-sm font-semibold leading-relaxed text-white mt-0.5">
                      {event?.venue || 'Bal-Gandharv Art Gallery, Jangali Maharaj Road, Pune 411030'}
                    </p>
                  </div>
                </div>

                {/* Divider and Event Title Only */}
                <div className="border-t border-white/15 pt-4 mt-2">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-bold">
                    {event?.title || 'National DSLR Wildlife & Landscape Championship 2026'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
