import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, AlertCircle } from 'lucide-react';

export default function Footer() {
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
                SumbaContest
              </span>
            </div>
            <p className="text-sm max-w-sm">
              The premier platform for organizing professional DSLR and Mirrorless photography competitions. Championing genuine photographic crafts worldwide.
            </p>
          </div>

          {/* Quick Rules Check */}
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              DSLR Guidelines
            </h3>
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span>Mobile photography, action cameras, and drone frames are strictly prohibited.</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>All uploads are scanned for camera brand and lens EXIF tags dynamically.</span>
            </div>
          </div>

          {/* Help & Support */}
          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-display font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1 text-xs">
              Support & Inquiries
            </h3>
            <p>Email: <a href="mailto:support@sumbacontest.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@sumbacontest.com</a></p>
            <p>Phone: +91 98765 43210 (Mon-Sat, 9AM - 6PM)</p>
            <p>Address: SumbaContest Inc., Bandra Kurla Complex, Mumbai, India</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-xs text-center">
          <p>&copy; {new Date().getFullYear()} SumbaContest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
