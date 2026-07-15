import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, Award, BookOpen, ShieldAlert, Sparkles, ChevronDown, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { apiFetch, user } = useAuth();

  const getEnrollLink = () => {
    if (!user) return '/register';
    if (user.role === 'Admin') return '/admin';
    if (user.role === 'Judge') return '/judge';
    return '/dashboard';
  };

  const getEnrollText = (defaultText) => {
    if (!user) return defaultText;
    if (user.role === 'Participant') return 'Upload Photos & Pay';
    return 'Go to Portal';
  };
  const [event, setEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [selectedTypeTab, setSelectedTypeTab] = useState('Photography');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [openFaq, setOpenFaq] = useState(null);

  const fetchEventsList = async () => {
    try {
      const data = await apiFetch('/api/events');
      if (data.success && data.events.length > 0) {
        setEventsList(data.events);
        const active = data.events.find(e => e.status === 'Active' && e.eventType === selectedTypeTab);
        setEvent(active || null);
      }
    } catch (err) {
      console.error('Error fetching landing event:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsList();
  }, []);

  useEffect(() => {
    if (eventsList.length > 0) {
      const active = eventsList.find(e => e.status === 'Active' && e.eventType === selectedTypeTab);
      setEvent(active || null);
    } else {
      setEvent(null);
    }
  }, [selectedTypeTab, eventsList]);

  // Countdown timer logic
  useEffect(() => {
    if (!event || !event.deadline) return;

    const interval = setInterval(() => {
      const difference = +new Date(event.deadline) - +new Date();
      
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Camera className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Loading Event Details...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200 pt-8">
      
      {/* Event Type Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto relative z-20">
        {['Photography', 'Painting', 'Drawing', 'Paper Craft', 'Other'].map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedTypeTab(type)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer ${
              selectedTypeTab === type
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {type} Info
          </button>
        ))}
      </div>

      {!event ? (
        <div className="max-w-md mx-auto text-center py-20 flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-8 rounded-3xl shadow-sm">
          <Camera className="w-10 h-10 text-indigo-500 animate-pulse" />
          <h2 className="font-display font-extrabold text-sm text-slate-900 dark:text-white mt-2">No Active {selectedTypeTab} Contests</h2>
          <p className="text-[11px] text-slate-500">
            There are currently no active {selectedTypeTab.toLowerCase()} competitions scheduled. Please explore our other contest categories!
          </p>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200 dark:border-slate-800/50 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Text Grid */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
              <div className="inline-flex self-center lg:self-start items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                Now Accepting Submissions
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-slate-900 dark:text-white">
                {event.title}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0">
                Theme: <strong className="text-slate-900 dark:text-white font-semibold">"{event.theme}"</strong>. {event.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-2">
                <Link
                  to={getEnrollLink()}
                  className="w-full sm:w-auto text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {getEnrollText('Register & Enter Now')}
                </Link>
                <a
                  href="#rules"
                  className="w-full sm:w-auto text-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-base px-8 py-3.5 rounded-xl transition-all"
                >
                  View Guidelines
                </a>
              </div>
            </div>

            {/* Countdown Grid */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <Calendar className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Submission Deadline</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(event.deadline).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-start gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <MapPin className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Exhibition Venue</p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {event.venue}
                      </p>
                    </div>
                  </div>
                )}

                {event.hasExhibition && (
                  <div className="flex items-start gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <Calendar className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Exhibition Schedule</p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {event.exhibitionFromDate && event.exhibitionToDate ? (
                          `${new Date(event.exhibitionFromDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} to ${new Date(event.exhibitionToDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                        ) : event.exhibitionFromDate ? (
                          `Starts ${new Date(event.exhibitionFromDate).toLocaleDateString(undefined, { dateStyle: 'long' })}`
                        ) : event.exhibitionToDate ? (
                          `Until ${new Date(event.exhibitionToDate).toLocaleDateString(undefined, { dateStyle: 'long' })}`
                        ) : (
                          'Dates to be announced'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3 font-semibold uppercase tracking-wider">
                    Time Remaining
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                      <span className="block font-display font-black text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400">{timeLeft.days}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Days</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                      <span className="block font-display font-black text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400">{timeLeft.hours}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hrs</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                      <span className="block font-display font-black text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400">{timeLeft.minutes}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mins</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                      <span className="block font-display font-black text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400">{timeLeft.seconds}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/20 p-3.5 rounded-2xl">
                  <ShieldAlert className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">DSLR Camera Only</h4>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 mt-0.5 leading-relaxed">
                      All submissions must be captured via DSLR/Mirrorless devices. Photos from smartphones will be flagged and disqualified.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Entry Packages */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Simple Entry Packages
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Select one entry tier. You can submit files up to the selected package limit. Valid payments are required to finalize submissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {event.packages.map((pkg) => (
            <div
              key={pkg.id}
              className="glass-card border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between text-center relative overflow-hidden"
            >
              <div className="flex flex-col gap-4">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {pkg.name}
                </span>
                <h3 className="font-display font-black text-4xl text-slate-900 dark:text-white">
                  ₹{pkg.price}
                </h3>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  Upload up to <span className="text-indigo-600 dark:text-indigo-400 text-lg font-black">{pkg.maxPhotos}</span> Photograph{pkg.maxPhotos > 1 ? 's' : ''}
                </p>
                <div className="w-10 h-0.5 bg-slate-200 dark:bg-slate-800 mx-auto my-1"></div>
                <ul className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-2.5">
                  <li>DSLR Metadata Checks</li>
                  <li>Digital Certificate included</li>
                  <li>Judge scoring reviews</li>
                  <li>High-Resolution uploads</li>
                </ul>
              </div>
              <Link
                to={getEnrollLink()}
                className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all text-center"
              >
                {getEnrollText('Select Package')}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Rules & Guidelines */}
      <section id="rules" className="py-16 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Rules Text */}
            <div className="flex flex-col gap-6">
              <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 text-amber-700 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                <BookOpen size={12} />
                Contest Rules
              </div>
              <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
                Contest Guidelines & {event.eventType === 'Photography' ? 'DSLR Mandate' : event.eventType === 'Painting' ? 'Canvas Mandate' : event.eventType === 'Drawing' ? 'Drawing Mandate' : event.eventType === 'Paper Craft' ? 'Paper Craft Mandate' : 'Artistry Mandate'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                This platform is designed to honor genuine {event.eventType === 'Photography' ? 'lensmanship' : event.eventType === 'Painting' ? 'painting artistry' : event.eventType === 'Drawing' ? 'drawing talents' : event.eventType === 'Paper Craft' ? 'paper-crafting expertise' : 'artistic craftsmanship'}. Please review the criteria carefully to avoid submission disqualification.
              </p>

              <div className="flex flex-col gap-3 mt-2">
                {event.rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="flex items-center justify-center w-5 h-5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prizes / Rewards Display */}
            <div className="flex flex-col gap-6">
              <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-md">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <Award className="text-indigo-600 dark:text-indigo-400" size={22} />
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Competition Awards</h3>
                </div>

                <div className="flex flex-col gap-4">
                  {event.prizes.map((prize, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-4 rounded-2xl border ${
                        idx === 0 
                          ? 'bg-amber-500/10 border-amber-500/30' 
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-150 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${idx === 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400'}`}>
                          {prize.rank}
                        </span>
                        <span className="font-display font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                          {prize.reward}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{prize.description}</span>
                      </div>
                      <Award 
                        size={32} 
                        className={
                          idx === 0 
                            ? 'text-amber-500 animate-pulse' 
                            : idx === 1 
                              ? 'text-slate-400' 
                              : 'text-amber-700'
                        } 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Everything you need to know about submissions, verification, payments, and timelines.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {event.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-display font-semibold text-slate-800 dark:text-slate-200 text-sm cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
