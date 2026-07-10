import React, { useEffect, useRef, useState } from 'react';

export default function WatermarkPreview({ src, className = "" }) {
  const [watermarkedSrc, setWatermarkedSrc] = useState('');

  useEffect(() => {
    if (!src) return;

    // Detect if the src is a local relative URL or data URL
    const fullSrc = src.startsWith('http') || src.startsWith('data:') 
      ? src 
      : `${window.location.origin}${src}`;

    const img = new Image();
    img.crossOrigin = "anonymous"; // prevent canvas taint issues
    img.src = fullSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Maintain high resolution (but capped at max 1200px for previews)
      const maxDim = 1200;
      let width = img.naturalWidth || 800;
      let height = img.naturalHeight || 600;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // Save context
      ctx.save();

      // Configure watermark text settings
      const fontSize = Math.max(14, Math.round(width / 22));
      ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = Math.max(1, Math.round(width / 700));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Translate to center to rotate
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-35 * Math.PI / 180);

      const text = "SUMBACONTEST PREVIEW";
      
      // Draw a grid of watermark texts
      const spacingX = Math.round(width / 2);
      const spacingY = Math.round(height / 2.5);

      for (let x = -width; x <= width; x += spacingX) {
        for (let y = -height; y <= height; y += spacingY) {
          ctx.fillText(text, x, y);
          ctx.strokeText(text, x, y);
        }
      }

      ctx.restore();

      // Export as a lightweight JPEG preview
      setWatermarkedSrc(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      // Fallback to original src if image fails to load in canvas
      setWatermarkedSrc(src);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden select-none bg-slate-900 rounded-lg ${className}`}>
      {watermarkedSrc ? (
        <img 
          src={watermarkedSrc} 
          alt="Watermarked Preview" 
          className="w-full h-full object-contain mx-auto" 
          onContextMenu={(e) => e.preventDefault()} // Block simple right-click save
        />
      ) : (
        <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 animate-pulse w-full h-64 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Watermarking Image Preview...
          </span>
        </div>
      )}
      {watermarkedSrc && (
        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm border border-white/10 text-white text-[10px] px-2.5 py-1 rounded font-display font-medium pointer-events-none uppercase tracking-wide">
          Protected Preview
        </div>
      )}
    </div>
  );
}
