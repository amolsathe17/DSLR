import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Award,
  Users,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Star,
  Trophy,
  CheckCircle2,
  Shield,
  Image,
  ChevronDown,
  BarChart2,
  Layers,
  Target,
  Flame,
  TrendingUp,
  Gift,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── How It Works steps ────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    icon: Target,
    title: "Choose an Event",
    desc: "Browse active, upcoming, and past events across all art categories and pick the one for you.",
  },
  {
    num: "02",
    icon: Users,
    title: "Register / Login",
    desc: "Create your participant account or log in to your existing profile to get started.",
  },
  {
    num: "03",
    icon: Image,
    title: "Submit Your Work",
    desc: "Upload your entries through the secure portal within the submission deadline.",
  },
  {
    num: "04",
    icon: Trophy,
    title: "Get Judged & Win",
    desc: "Expert judges review your work and the best entries win exciting prizes and certificates.",
  },
];

// ── Why Participate cards ─────────────────────────────────────────────────────

const WHY_CARDS = [
  {
    icon: Trophy,
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "Cash Prizes & Awards",
    desc: "Win exciting cash rewards, trophies, medals, and recognition across all categories.",
  },
  {
    icon: Shield,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    title: "Digital Certificates",
    desc: "Every participant receives a personalized participation certificate. Winners get special honour certificates.",
  },
  {
    icon: Star,
    color: "text-rose-500",
    bg: "bg-rose-50",
    title: "Expert Judging Panel",
    desc: "Your work is evaluated by seasoned professionals and domain experts ensuring fair, unbiased results.",
  },
  {
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    title: "Multiple Art Forms",
    desc: "Photography, Painting, Drawing, Paper Craft and more — a platform for every creative artist.",
  },
  {
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-50",
    title: "Live Competitions",
    desc: "Participate in real-time active contests with live countdowns and instant enrollment.",
  },
  {
    icon: TrendingUp,
    color: "text-violet-500",
    bg: "bg-violet-50",
    title: "Track Your Progress",
    desc: "Monitor submission status, judging progress, and results all from your personal dashboard.",
  },
];

// ── Art categories showcase ───────────────────────────────────────────────────

const ART_CATEGORIES = [
  { label: "Photography", icon: Camera, color: "bg-indigo-600" },
  { label: "Painting", icon: Image, color: "bg-rose-500" },
  { label: "Drawing", icon: Image, color: "bg-amber-500" },
  { label: "Paper Craft", icon: Image, color: "bg-emerald-600" },
];

// ── Main Landing Page ─────────────────────────────────────────────────────────

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const howItWorksRef = useRef(null);

  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleCTA = () => {
    if (!user) {
      navigate("/register");
    } else if (user.role === "Admin") {
      navigate("/admin");
    } else if (user.role === "Judge") {
      navigate("/judge");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen text-slate-800">

      {/* ══════════════════════════════════════════════════════════════════════
          FIXED HERO BACKGROUND — hero-bg.jpg scrolls beneath all content
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Dark overlay so text stays readable over the photo */}
      <div className="fixed inset-0 -z-10 bg-black/55" />

      {/* ══════════════════════════════════ HERO ═══════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-24 text-white text-center">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles size={13} />
            Multi-Category Art Competition Platform
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-4">
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight drop-shadow-lg">
              Compete, Create &amp;
              <span className="block bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                Conquer
              </span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto drop-shadow">
              A unified platform for Photography, Painting, Drawing, Paper Craft &amp; more.
              Discover active events, submit your work, and win recognition.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            {[
              { icon: CheckCircle2, label: "Expert Judging Panel", color: "text-emerald-400" },
              { icon: Gift, label: "Cash Prizes & Awards", color: "text-amber-400" },
              { icon: Shield, label: "Digital Certificates", color: "text-indigo-400" },
            ].map(({ icon: I, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-sm font-semibold text-white/85">
                <I size={15} className={color} /> {label}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={handleCTA}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3.5 px-8 rounded-2xl cursor-pointer transition-all shadow-xl shadow-indigo-900/40"
            >
              {user ? "Go to My Dashboard" : "Get Started Free"} <ArrowRight size={16} />
            </button>
            <Link
              to="/info"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-sm py-3.5 px-8 rounded-2xl cursor-pointer transition-all backdrop-blur-sm"
            >
              View All Events <ChevronRight size={16} />
            </Link>
          </div>

          {/* Art category pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {ART_CATEGORIES.map(({ label, icon: Icon, color }) => (
              <span
                key={label}
                className={`flex items-center gap-1.5 ${color} text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full`}
              >
                <Icon size={11} /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
          <ChevronDown size={22} />
        </div>
      </section>

      {/* ══════════════════════════════ WHY PARTICIPATE ════════════════════════ */}
      <section className="relative py-20 bg-white/95 backdrop-blur-sm border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3">
              <Sparkles size={11} /> Why Join Us
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">
              Why Participate?
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Join thousands of artists competing on a platform built to showcase creativity and reward talent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CARDS.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 mb-1.5">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ CTA BANNER ═════════════════════════════ */}
      <section className="relative py-20">
        {/* semi-transparent dark card sitting above the fixed hero-bg */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-linear-to-br from-indigo-600 to-violet-700 rounded-3xl px-8 py-14 text-center flex flex-col items-center gap-6 shadow-2xl shadow-indigo-900/40 overflow-hidden relative">
            {/* decorative blob */}
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-20"
              style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }}
            />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
              <Award size={12} /> Simple Process
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
              How It Works
            </h2>
            <p className="text-indigo-100 text-sm max-w-md leading-relaxed">
             Four easy steps from registration to winning.
            </p>
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


            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm py-3.5 px-8 rounded-2xl cursor-pointer transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Create Account <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/info"
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-sm py-3.5 px-8 rounded-2xl cursor-pointer transition-all"
                  >
                    View Events <ChevronRight size={15} />
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleCTA}
                  className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm py-3.5 px-8 rounded-2xl cursor-pointer transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Go to My Dashboard <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
