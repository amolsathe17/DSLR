import React, { useEffect, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { apiFetch } = useAuth();
  const [eventType, setEventType] = useState('Photography');

  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        const data = await apiFetch('/api/events');
        if (data.success && data.events.length > 0) {
          const active = data.events.find(e => e.status === 'Active') || data.events[0];
          if (active) {
            setEventType(active.eventType || 'Photography');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchActiveEvent();
  }, [apiFetch]);

  const getDescription = () => {
    switch (eventType) {
      case 'Photography':
        return 'The premier platform for organizing professional DSLR and Mirrorless photography competitions. Championing genuine photographic crafts worldwide.';
      case 'Painting':
        return 'The premier platform for organizing professional physical painting competitions. Celebrating color, texture, and original canvas artistry.';
      case 'Drawing':
        return 'The premier platform for organizing professional sketching and hand-drawn competitions. Showcasing fine line work, charcoal art, and sketches.';
      case 'Paper Craft':
        return 'The premier platform for organizing creative paper craft, origami, and paper sculpture competitions. Crafting wonder from simple sheets.';
      default:
        return 'The premier platform for organizing fine art and creative skill championships. Championing genuine craftsmanship and artistic designs.';
    }
  };

  const getRule1 = () => {
    switch (eventType) {
      case 'Photography':
        return 'Mobile photography, action cameras, and drone frames are strictly prohibited.';
      case 'Painting':
        return 'Digital paintings, digital prints, and AI-generated artwork are strictly prohibited.';
      case 'Drawing':
        return 'Digital sketches, AI-generated drawings, and trace-overs are strictly prohibited.';
      case 'Paper Craft':
        return 'Pre-fabricated kits, plastic models, and commercial templates are prohibited.';
      default:
        return 'Copying, plagiarism, and AI-generated submissions are strictly prohibited.';
    }
  };

  const getRule2 = () => {
    switch (eventType) {
      case 'Photography':
        return 'All uploads are scanned for camera brand and lens EXIF tags dynamically.';
      case 'Painting':
        return 'All painting entries must be clear, high-resolution photographs of physical art pieces.';
      case 'Drawing':
        return 'All drawings must be hand-made and uploaded as clear scans or high-resolution photos.';
      case 'Paper Craft':
        return 'All entries must be made primarily of paper and show clear 3D details.';
      default:
        return 'All submissions must be original creations and follow theme specifications.';
    }
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Logo & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Camera size={16} />
              </div>
              <span className="font-display font-bold text-slate-900 dark:text-white">
                DSLR Contest Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              We are dedicated to celebrating the authentic art of photography and visual skills. Our platform provides a transparent, professional environment for camera enthusiasts and artists to showcase their craftsmanship and compete.
            </p>
          </div>

          {/* Quick Rules Check */}
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              {eventType} Guidelines
            </h3>
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span>{getRule1()}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>{getRule2()}</span>
            </div>
          </div>

          {/* Help & Support */}
          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-display font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1 text-xs">
              Support & Inquiries
            </h3>
            <p>Email: <a href="mailto:support@dslrcontest.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@dslrcontest.com</a></p>
            <p>Phone: +91 98765 43210 (Mon-Sat, 9AM - 6PM)</p>
            <p>Address: DSLR Contest Association, BKC, Mumbai, India</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-xs text-center">
          <p>&copy; {new Date().getFullYear()} DSLR Contest Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
