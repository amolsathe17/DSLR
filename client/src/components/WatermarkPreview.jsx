import React, { useState } from 'react';

export default function WatermarkPreview({ src, className = "", enableZoom = false }) {
  const [zoomStyle, setZoomStyle] = useState({
    transform: 'scale(1)',
    transformOrigin: 'center'
  });

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 animate-pulse w-full h-64 border border-slate-200 dark:border-slate-800">
        <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
          Loading Image Preview...
        </span>
      </div>
    );
  }

  const handleMouseMove = (e) => {
    if (!enableZoom) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(2.5)',
      transformOrigin: `${x}% ${y}%`,
      transition: 'transform 0.05s ease-out'
    });
  };

  const handleMouseLeave = () => {
    if (!enableZoom) return;
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center',
      transition: 'transform 0.15s ease-in-out'
    });
  };

  return (
    <div 
      className={`relative overflow-hidden bg-slate-900 rounded-lg ${enableZoom ? 'cursor-zoom-in' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img 
        src={src} 
        alt="Image Preview" 
        style={enableZoom ? zoomStyle : undefined}
        className="w-full h-full object-contain mx-auto" 
      />
    </div>
  );
}
