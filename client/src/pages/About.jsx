import React from 'react';
import { Sparkles, Heart, Compass, Feather, Quote, Palette } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto flex flex-col gap-12 sm:gap-16">
        
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            <Sparkles size={12} />
            The Sumba Story
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-slate-900 dark:text-white leading-tight">
            Honoring Art in its <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Truest Form</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
            A celebration of heritage, tribal traditions, and decades of creative devotion, keeping fading voices alive.
          </p>
        </div>

        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Core Mission */}
          <div className="group relative glass-panel border border-slate-200/65 dark:border-slate-800/65 p-8 rounded-3xl shadow-xl flex flex-col gap-5 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all duration-300 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-tr-3xl rounded-bl-full -z-10"></div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl w-max">
              <Compass size={24} />
            </div>
            <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white leading-snug">
              A First-of-its-Kind Artfest
            </h2>
            <p className="text-xs sm:text-sm text-slate-505 dark:text-slate-400 leading-relaxed font-medium">
              A first-of-its-kind artfest in Maharashtra, Sumba was created to celebrate art in its truest form. This year shines a light on fading tribal traditions, many kept alive by only a few families. By giving these artists a stage, we hope their stories travel farther and last longer.
            </p>
          </div>

          {/* Card 2: Inspiration & Legacy */}
          <div className="group relative glass-panel border border-slate-200/65 dark:border-slate-800/65 p-8 rounded-3xl shadow-xl flex flex-col gap-5 hover:border-pink-500/40 dark:hover:border-pink-400/40 transition-all duration-300 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/10 to-transparent rounded-tr-3xl rounded-bl-full -z-10"></div>
            <div className="p-3 bg-pink-50 dark:bg-pink-950/30 text-pink-500 dark:text-pink-400 rounded-2xl w-max">
              <Feather size={24} />
            </div>
            <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white leading-snug">
              Carrying Forward The Belief
            </h2>
            <p className="text-xs sm:text-sm text-slate-505 dark:text-slate-400 leading-relaxed font-medium">
              Inspired by Late Prof. Raosaheb Gurav and his 6 decades of devotion to art, Sumba carries forward his belief that every artist deserves to be seen. The festival will return each year, keeping his spirit and the artists he cared for at its heart.
            </p>
          </div>

        </div>

        {/* The Legacy Tribute Spotlight */}
        <div className="relative glass-panel border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-12 rounded-3xl shadow-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-lg flex flex-col md:flex-row gap-8 items-center overflow-hidden">
          {/* Subtle design element */}
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -z-10"></div>
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400">
              <Palette size={20} />
              <span className="font-display font-bold text-xs uppercase tracking-widest">Legacy Tribute</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Late Prof. Raosaheb Gurav
            </h2>
            <div className="flex gap-2">
              <Quote className="text-slate-300 dark:text-slate-700 shrink-0" size={32} />
              <p className="text-xs sm:text-sm text-slate-505 dark:text-slate-400 leading-relaxed italic font-medium">
                Sumba was created in memory of Late Prof. Raosaheb Gurav, whose life was shaped by art, mentorship, and an unbreakable bond with tradition. His work, especially the Dhangar series, carried the landscapes of his childhood and the honesty of rural life, and his guidance helped generations of young artists find their path. He believed that art should stay rooted in its people and that every artist deserves a stage.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Support/Community Link */}
        <div className="text-center flex flex-col items-center gap-4 py-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Heart size={14} className="text-red-500 fill-current animate-pulse" />
            <span>Dedicated to preserving fading tribal traditions and creative mentorship.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
