import React from 'react';
import { Camera, Shield, Award, Users, Heart, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        
        {/* Header Section */}
        <div className="text-center flex flex-col gap-3">
          <div className="mx-auto p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-3xl w-max">
            <Camera size={36} />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight text-slate-900 dark:text-white mt-2">
            Celebrating Artistic Integrity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            The DSLR Contest Portal is dedicated to celebrating the authentic craft of photography and fine arts. We create transparent, professional environments for talent recognition.
          </p>
        </div>

        {/* Pillars / Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          
          <div className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl w-max">
              <Shield size={20} />
            </div>
            <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-base">
              Absolute Transparency
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We champion honesty in competitions. Every contestant can verify their billing ledgers, and every submission is evaluated by professional judges using detailed grading criteria.
            </p>
          </div>

          <div className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl w-max">
              <Camera size={20} />
            </div>
            <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-base">
              The DSLR Standard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mobile photography is excluded to challenge artists to use manual control, focal manipulation, raw metadata verification, and optical depth.
            </p>
          </div>

          <div className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl w-max">
              <Award size={20} />
            </div>
            <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-base">
              Merit-Based Awards
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Prizes are distributed based purely on mathematical scoring metrics across criteria including Composition, Technical Quality, Creativity, and Storytelling.
            </p>
          </div>

          <div className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="p-2 bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 rounded-xl w-max">
              <Users size={20} />
            </div>
            <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-base">
              Community Centered
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Based at Bandra Kurla Complex (BKC), Mumbai, our association supports photographers, painters, sketch artists, and paper-sculpture craftsmen worldwide.
            </p>
          </div>

        </div>

        {/* Detailed Story Section */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-md flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
              Our Vision & Future
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            As technology integrates with artificial intelligence, authentic human photography and manual optical mastery face a defining challenge. The DSLR Contest Portal aims to build a robust archive of real human talent.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            By cataloging entries, compiling results into secure PDF backups, and hosting local gallery exhibitions in Pune and Mumbai, we connect emerging lensmen and sketch artists directly with public collectors.
          </p>
        </div>

        {/* Association Contact Card */}
        <div className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 dark:border-slate-800 flex justify-center items-center gap-2">
          <Heart size={14} className="text-red-500 fill-current animate-pulse" />
          <span>Made for DSLR & Mirrorless Camera Enthusiasts Globally.</span>
        </div>

      </div>
    </div>
  );
}
