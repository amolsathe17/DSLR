import React from 'react';

export default function WatermarkPreview({ src, className = "" }) {
  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 animate-pulse w-full h-64 border border-slate-200 dark:border-slate-800">
        <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
          Loading Image Preview...
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-900 rounded-lg ${className}`}>
      <img 
        src={src} 
        alt="Image Preview" 
        className="w-full h-full object-contain mx-auto" 
      />
    </div>
  );
}
