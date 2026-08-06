import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
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
            <h1 className="font-display font-black text-5xl sm:text-5xl lg:text-7xl lg:mt-30 sm:mt-40 leading-[1.1] tracking-tight drop-shadow-lg">
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
                    Explore Events
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
        <div className="absolute bottom-25 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
          <ChevronDown size={22} />
        </div>
      </section>

      {/* ══════════════════════════════ CTA BANNER ═════════════════════════════ */}
      <section className="relative py-16 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-linear-to-br from-blue-600 to-black-700 rounded-3xl px-8 py-14 text-center flex flex-col items-center gap-6 shadow-2xl shadow-black-900/90 overflow-hidden relative">
            {/* Decorative blob */}
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-20"
              style={{ background: "radial-gradient(circle, #a78bfa 50%, transparent 80%)" }}
            />
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
              Ready to Showcase Your Talent?
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Explore Events and enter any of our active competitions. Cash prizes, certificates, and recognition await!
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap mt-3">
              {!user ? (
                <>
                  <Link
                    to="/info"
                    className="bg-white hover:bg-red-700 text-black hover:text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                  >
                    Explore Events
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
