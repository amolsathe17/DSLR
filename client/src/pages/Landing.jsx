import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Sparkles, Compass, Feather, Quote, Palette } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen text-slate-800 bg-white dark:bg-slate-950">

      {/* ══════════════════════════════════ HERO ═══════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-24 text-white text-center overflow-hidden">
        {/* Background Image - Scoped strictly to Hero section */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-0 bg-black/60" />

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8">
          {/* Headline */}
          <div className="flex flex-col gap-4">
            <h1 className="font-display font-black text-5xl sm:text-5xl lg:text-7xl lg:mt-30 sm:mt-40 leading-[1.1] tracking-tight drop-shadow-lg pt-28">
              Compete, Create &amp;
              <span className="block bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                Conquer
              </span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto drop-shadow">
              A unified platform for Photography, Painting, Drawing, Paper Craft &amp; more.
              Discover active events, submit your work, and win recognition.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap mt-3">
              {!user ? (
                <>
                  <Link
                    to="/info"
                    className="bg-white hover:bg-red-700 text-black hover:text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                  >
                    Explore / Enroll  Events
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-white hover:bg-red-700 text-black hover:text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                >
                  Go to My Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-15 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
          <ChevronDown size={22} />
        </div>
      </section>

      {/* ══════════════════════════════ THE SUMBA STORY ═════════════════════════════ */}
      <section className="py-5 bg-slate-300 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/3 left-1/10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 sm:gap-16">
          
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Sparkles size={12} />
              The Sumba Story
            </div>
            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 dark:text-white leading-tight">
              Honoring Art in its <span className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Truest Form</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              A celebration of heritage, tribal traditions, and decades of creative devotion, keeping fading voices alive.
            </p>
          </div>

          {/* Highlight Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Card 1: Core Mission */}
            <div className="group relative glass-panel border border-slate-200/65 dark:border-slate-800/65 p-8 rounded-3xl shadow-xl flex flex-col gap-5 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all duration-300 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-indigo-500/10 to-transparent rounded-tr-3xl rounded-bl-full -z-10" />
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl w-max">
                <Compass size={24} />
              </div>
              <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white leading-snug">
                A First-of-its-Kind Artfest
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                A first-of-its-kind artfest in Maharashtra, Sumba was created to celebrate art in its truest form. This year shines a light on fading tribal traditions, many kept alive by only a few families. By giving these artists a stage, we hope their stories travel farther and last longer.
              </p>
            </div>

            {/* Card 2: Inspiration & Legacy */}
            <div className="group relative glass-panel border border-slate-200/65 dark:border-slate-800/65 p-8 rounded-3xl shadow-xl flex flex-col gap-5 hover:border-pink-500/40 dark:hover:border-pink-400/40 transition-all duration-300 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-pink-500/10 to-transparent rounded-tr-3xl rounded-bl-full -z-10" />
              <div className="p-3 bg-pink-50 dark:bg-pink-950/30 text-pink-500 dark:text-pink-400 rounded-2xl w-max">
                <Feather size={24} />
              </div>
              <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white leading-snug">
                Carrying Forward The Belief
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Inspired by Late Prof. Raosaheb Gurav and his 6 decades of devotion to art, Sumba carries forward his belief that every artist deserves to be seen. The festival will return each year, keeping his spirit and the artists he cared for at its heart.
              </p>
            </div>

          </div>

          {/* The Legacy Tribute Spotlight */}
          <div className="relative glass-panel border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-12 rounded-3xl shadow-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-lg flex flex-col md:flex-row gap-8 items-center overflow-hidden">
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -z-10" />
            
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Palette size={20} />
                <span className="font-display font-bold text-xs uppercase tracking-widest">Legacy Tribute</span>
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                Late Prof. Raosaheb Gurav
              </h3>
              <div className="flex gap-2">
                <Quote className="text-slate-300 dark:text-slate-700 shrink-0" size={32} />
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium">
                  Sumba was created in memory of Late Prof. Raosaheb Gurav, whose life was shaped by art, mentorship, and an unbreakable bond with tradition. His work, especially the Dhangar series, carried the landscapes of his childhood and the honesty of rural life, and his guidance helped generations of young artists find their path. He believed that art should stay rooted in its people and that every artist deserves a stage.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════ CTA BANNER ═════════════════════════════ */}
      <section className="py-14 bg-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-1">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">
              Ready to Showcase Your Talent?
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Ready to compete? Create your account and start participating
              today.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap mt-3">
              {!user ? (
                <>
                  <Link
                    to="/info"
                    className="bg-blue-600 hover:bg-red-700 text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                  >
                    Explore / Enroll  Events
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-white hover:bg-red-700 text-black hover:text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                >
                  Go to My Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
