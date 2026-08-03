import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera, Calendar, Award, Users, ChevronRight, ArrowRight,
  Sparkles, MapPin, Star, Palette, PenLine, Scissors,
  Trophy, CheckCircle2, Zap, Shield, Globe, Image, Play,
  ChevronDown, BarChart2, BookOpen, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EVENT_ICONS = {
  Photography: Camera,
  Painting: Palette,
  Drawing: PenLine,
  'Paper Craft': Scissors,
  default: Image,
};

const EVENT_COLORS = {
  Photography: {
    bg: 'bg-indigo-50 border-indigo-200/60',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: 'text-indigo-600',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    glow: 'from-indigo-400/20',
    countdown: 'text-indigo-600',
  },
  Painting: {
    bg: 'bg-rose-50 border-rose-200/60',
    badge: 'bg-rose-100 text-rose-700',
    icon: 'text-rose-500',
    btn: 'bg-rose-500 hover:bg-rose-600',
    glow: 'from-rose-400/20',
    countdown: 'text-rose-500',
  },
  Drawing: {
    bg: 'bg-amber-50 border-amber-200/60',
    badge: 'bg-amber-100 text-amber-700',
    icon: 'text-amber-500',
    btn: 'bg-amber-500 hover:bg-amber-600',
    glow: 'from-amber-400/20',
    countdown: 'text-amber-500',
  },
  'Paper Craft': {
    bg: 'bg-emerald-50 border-emerald-200/60',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: 'text-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    glow: 'from-emerald-400/20',
    countdown: 'text-emerald-600',
  },
  default: {
    bg: 'bg-slate-50 border-slate-200/60',
    badge: 'bg-slate-100 text-slate-600',
    icon: 'text-slate-500',
    btn: 'bg-slate-700 hover:bg-slate-800',
    glow: 'from-slate-400/20',
    countdown: 'text-slate-700',
  },
};

function getColors(type) {
  return EVENT_COLORS[type] || EVENT_COLORS.default;
}

function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0, expired: false,
  });

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = +new Date(deadline) - +new Date();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
}

// â”€â”€ CountdownUnit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CountdownUnit({ value, label, colorClass }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-display font-black text-xl sm:text-2xl tabular-nums ${colorClass}`}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

// â”€â”€ EventCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EventCard({ event, onEnroll }) {
  const colors = getColors(event.eventType);
  const Icon = EVENT_ICONS[event.eventType] || EVENT_ICONS.default;
  const countdown = useCountdown(event.deadline);

  return (
    <div className={`group relative flex flex-col border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white ${colors.bg}`}>
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      {/* Top bar */}
      <div className="relative flex items-start justify-between p-5 pb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${colors.badge} shrink-0`}>
          <Icon size={20} className={colors.icon} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${colors.badge}`}>
            {event.eventType}
          </span>
        </div>
      </div>

      {/* Title / theme */}
      <div className="relative px-5 flex flex-col gap-1.5 flex-grow">
        <h3 className="font-display font-black text-base text-slate-900 leading-snug line-clamp-2">{event.title}</h3>
        {event.theme && (
          <p className="text-[10px] text-slate-500 font-semibold italic">Theme: "{event.theme}"</p>
        )}
        {event.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-0.5">{event.description}</p>
        )}
      </div>

      {/* Countdown */}
      <div className="relative mx-5 my-4 bg-slate-50 border border-slate-100 rounded-2xl p-3">
        {countdown.expired ? (
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submissions Closed</p>
        ) : (
          <>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center mb-2">Time Remaining</p>
            <div className="flex items-center justify-center gap-3">
              <CountdownUnit value={countdown.days} label="Days" colorClass={colors.countdown} />
              <span className="text-slate-300 font-black text-lg">:</span>
              <CountdownUnit value={countdown.hours} label="Hrs" colorClass={colors.countdown} />
              <span className="text-slate-300 font-black text-lg">:</span>
              <CountdownUnit value={countdown.minutes} label="Min" colorClass={colors.countdown} />
              <span className="text-slate-300 font-black text-lg">:</span>
              <CountdownUnit value={countdown.seconds} label="Sec" colorClass={colors.countdown} />
            </div>
          </>
        )}
      </div>

      {/* Meta row */}
      <div className="relative px-5 pb-4 flex flex-col gap-1.5 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar size={11} className="shrink-0 text-slate-400" />
          <span>Deadline: <strong className="text-slate-700">{new Date(event.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}</strong></span>
        </div>
        {event.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="shrink-0 text-slate-400" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
        {event.packages?.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Star size={11} className="shrink-0 text-slate-400" />
            <span>From <strong className="text-slate-700">â‚¹{Math.min(...event.packages.map(p => p.price))}</strong> Â· {event.packages.length} package{event.packages.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="relative px-5 pb-5">
        <button
          onClick={() => onEnroll(event)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${colors.btn}`}
        >
          Enroll in This Event
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

// â”€â”€ Stats strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatStrip({ events }) {
  const totalActive = events.filter(e => e.status === 'Active').length;
  const types = [...new Set(events.map(e => e.eventType))];
  const stats = [
    { icon: Zap,    label: 'Active Events',     value: totalActive || 'â€”' },
    { icon: Layers, label: 'Event Categories',  value: types.length || 'â€”' },
    { icon: Shield, label: 'Secure Platform',   value: '100%' },
    { icon: Globe,  label: 'Open Registration', value: 'Live' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-2xl py-5 px-4 shadow-sm text-center">
          <Icon size={18} className="text-indigo-500" />
          <span className="font-display font-black text-2xl text-slate-900">{value}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}

// â”€â”€ How it works steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STEPS = [
  { num: '01', icon: Users,    title: 'Register / Login',  desc: 'Create your participant account or log in to your existing profile to get started.' },
  { num: '02', icon: Calendar, title: 'Choose an Event',   desc: 'Browse all active events and select the one that matches your artistic skill.' },
  { num: '03', icon: Image,    title: 'Submit Your Work',  desc: 'Upload your entries through the secure portal within the submission deadline.' },
  { num: '04', icon: Trophy,   title: 'Get Judged & Win',  desc: 'Expert judges review your work and the best entries win exciting prizes.' },
];

// â”€â”€ Main Landing Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Landing() {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroEvent, setHeroEvent] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const eventsRef = useRef(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiFetch('/api/events');
        if (data.success && data.events?.length > 0) {
          const all = data.events;
          const active = all.filter(e => e.status === 'Active');
          setAllEvents(all);
          setActiveEvents(active);
          setHeroEvent(active[0] || all[0] || null);
        }
      } catch (err) {
        console.error('Landing: failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleEnroll = (event) => {
    if (!user) {
      navigate('/login', { state: { from: '/dashboard', eventId: event._id } });
    } else if (user.role === 'Admin') {
      navigate('/admin');
    } else if (user.role === 'Judge') {
      navigate('/judge');
    } else {
      navigate('/dashboard');
    }
  };

  const scrollToEvents = () => {
    eventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const displayedEvents = showAllEvents ? activeEvents : activeEvents.slice(0, 6);

  // â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Events...</span>
      </div>
    );
  }

  // â”€â”€ Page render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="bg-white min-h-screen text-slate-800">

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HERO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/30 border-b border-slate-100">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-400/8 blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-400/8 blur-3xl pointer-events-none translate-y-1/4 -translate-x-1/4" />
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left: headline + CTAs */}
            <div className="flex flex-col gap-7 text-center lg:text-left">
              <div className="inline-flex self-center lg:self-start items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200/60 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                Multi-Event Competition Platform
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight text-slate-900">
                  Compete, Create &amp;
                  <span className="relative inline-block ml-3">
                    <span className="relative z-10 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      Conquer
                    </span>
                    <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full opacity-40" />
                  </span>
                </h1>
                <p className="text-base text-slate-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  A unified platform for Photography, Painting, Drawing, Paper Craft &amp; more. Discover active events, submit your work, and win recognition.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Register Free <ChevronRight size={15} />
                    </Link>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-7 py-3 rounded-xl transition-all cursor-pointer"
                    >
                      Login
                    </Link>
                  </>
                ) : (
                  <Link
                    to={user.role === 'Admin' ? '/admin' : user.role === 'Judge' ? '/judge' : '/dashboard'}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Go to Dashboard <ChevronRight size={15} />
                  </Link>
                )}
                <button
                  onClick={scrollToEvents}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold text-sm px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  <Play size={13} className="fill-current" />
                  View Active Events
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {['Expert Judging Panel', 'Digital Certificates', 'Cash Prizes'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: featured event or category grid */}
            <div className="flex flex-col gap-5">
              {heroEvent ? (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        {heroEvent.eventType}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Now
                      </span>
                    </div>
                    <h2 className="font-display font-black text-xl leading-tight">{heroEvent.title}</h2>
                    {heroEvent.theme && <p className="text-white/70 text-xs mt-1">"{heroEvent.theme}"</p>}
                  </div>
                  <div className="px-6 py-4 flex flex-col gap-4">
                    {heroEvent.prizes?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top Prizes</p>
                        <div className="flex flex-col gap-1.5">
                          {heroEvent.prizes.slice(0, 3).map((p, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                                i === 0 ? 'bg-amber-50 border border-amber-200/60 text-amber-800' : 'bg-slate-50 border border-slate-100 text-slate-600'
                              }`}
                            >
                              <span className="font-bold">{p.rank}</span>
                              <span>{p.reward}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        Deadline:{' '}
                        <strong className="text-slate-700 ml-1">
                          {new Date(heroEvent.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </strong>
                      </div>
                      {heroEvent.packages?.length > 0 && (
                        <span className="font-bold text-indigo-600">
                          From â‚¹{Math.min(...heroEvent.packages.map(p => p.price))}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEnroll(heroEvent)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      Enroll Now <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(EVENT_ICONS)
                    .filter(([k]) => k !== 'default')
                    .map(([type, Icon]) => {
                      const c = getColors(type);
                      return (
                        <div key={type} className={`flex flex-col items-center gap-2 border rounded-2xl p-5 ${c.bg}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.badge}`}>
                            <Icon size={18} className={c.icon} />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{type}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="flex justify-center pb-6">
          <button
            onClick={scrollToEvents}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer animate-bounce"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STATS STRIP â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-10 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <StatStrip events={allEvents} />
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ACTIVE EVENTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section ref={eventsRef} className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open for Registration
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
              Active Events
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Select any event below to enroll and start your artistic journey.
            </p>
          </div>
          {activeEvents.length > 6 && (
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="shrink-0 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2 transition-all cursor-pointer"
            >
              {showAllEvents ? 'Show Less' : `View All ${activeEvents.length}`}
              <ChevronRight size={14} className={`transition-transform ${showAllEvents ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {activeEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Calendar size={28} className="text-slate-300" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-700">No Active Events Right Now</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              We're preparing exciting new competitions. Check back soon or register to get notified.
            </p>
            {!user && (
              <Link
                to="/register"
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all"
              >
                Register to Get Notified
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map(event => (
              <EventCard key={event._id} event={event} onEnroll={handleEnroll} />
            ))}
          </div>
        )}
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HOW IT WORKS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3">
              <BarChart2 size={11} /> Simple Process
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">How It Works</h2>
            <p className="text-sm text-slate-500 mt-2">Four easy steps from registration to winning.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <div
                key={num}
                className="relative flex flex-col gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 w-6 border-t-2 border-dashed border-slate-200 z-10" />
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                    <Icon size={18} className="text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="font-display font-black text-2xl text-slate-200">{num}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CATEGORIES SHOWCASE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-black uppercase tracking-widest mb-3">
            <BookOpen size={11} /> Event Categories
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">What We Organize</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            From lens-based photography to hand-crafted paper art â€” competitions for every artistic discipline.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Object.entries(EVENT_ICONS)
            .filter(([k]) => k !== 'default')
            .map(([type, Icon]) => {
              const c = getColors(type);
              const count = allEvents.filter(e => e.eventType === type).length;
              return (
                <button
                  key={type}
                  onClick={scrollToEvents}
                  className={`group flex flex-col items-center gap-3 border rounded-3xl py-8 px-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${c.bg} w-full`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${c.badge} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={c.icon} />
                  </div>
                  <div>
                    <p className="font-display font-black text-sm text-slate-900">{type}</p>
                    {count > 0 && (
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{count} event{count > 1 ? 's' : ''} available</p>
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CTA BANNER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-14 bg-gradient-to-br from-indigo-600 to-violet-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
            <Award size={12} /> Join the Competition
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
            Ready to Showcase Your Talent?
          </h2>
          <p className="text-indigo-100 text-sm max-w-md">
            Register for free, pick an active event that excites you, and compete with artists for exciting awards and recognition.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-sm px-8 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Create Account Free <ChevronRight size={14} />
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Login
                </Link>
              </>
            ) : (
              <Link
                to={user.role === 'Admin' ? '/admin' : user.role === 'Judge' ? '/judge' : '/dashboard'}
                className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-sm px-8 py-3 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Go to Dashboard <ChevronRight size={14} />
              </Link>
            )}
            <button
              onClick={scrollToEvents}
              className="flex items-center gap-2 text-white/70 hover:text-white font-semibold text-sm transition-all cursor-pointer"
            >
              Browse Events <ChevronDown size={13} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
