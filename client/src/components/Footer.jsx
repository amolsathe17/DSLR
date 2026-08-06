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
    <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Column 1: About Us */}
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Who We are..
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Sumba was created in memory of Late Prof. Raosaheb Gurav, whose life was shaped by art, mentorship, and an unbreakable bond with tradition. His work, especially the Dhangar series, carried the landscapes of his childhood and the honesty of rural life, and his guidance helped generations of young artists find their path. He believed that art should stay rooted in its people and that every artist deserves a stage.
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-4 mt-2 text-slate-400 dark:text-slate-500">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors duration-200" title="YouTube">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors duration-200" title="Instagram">
                <svg stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-colors duration-200" title="Twitter/X">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors duration-200" title="Facebook">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors duration-200" title="WhatsApp">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.47l-6.256 1.647zM6.583 5.466c-.159-.353-.327-.361-.48-.367l-.407-.008c-.141 0-.37.053-.564.265-.194.212-.74.723-.74 1.761 0 1.038.756 2.04 8.62 10.22c.106.113 2.03 3.099 4.92 4.35 2.41 1.04 2.9.832 3.42.783.52-.049 1.674-.684 1.908-1.346.234-.662.234-1.23.164-1.346-.07-.116-.257-.185-.542-.327-.285-.141-1.674-.827-1.933-.922-.259-.095-.448-.141-.637.141-.189.283-.733.922-.897 1.111-.164.189-.328.212-.613.07-.285-.141-1.205-.444-2.295-1.416-.848-.756-1.42-1.69-1.586-1.97-.166-.282-.018-.435.124-.575.127-.126.284-.33.426-.496.142-.166.189-.283.284-.473.095-.19.048-.355-.024-.496-.071-.141-.637-1.536-.873-2.107z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Location Map */}
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Our Location
            </h3>
            <div className="w-full h-53.25 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
              <iframe
                title="Google Map Location"
                src="https://maps.google.com/maps?q=Trio%20Chambers,%20Sadashiv%20Peth,%20Pune%20-%20411030&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Column 3: Support */}
          <div className="flex flex-col gap-3 text-sm">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Support & Inquiries
            </h3>
            <p><b>Email:</b><br></br> <a href="mailto:support@sumbaranartsociety.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@sumbaranartsociety.com</a></p>
            <p><b>Phone:</b><br></br> +91 98765 43210 (Mon-Sat, 9AM - 6PM)</p>
            <p><b>Address:</b> <br></br>1414/1A, Trio Chambers, Nr. Renuka Swaroop Girls High School, Sadashiv Peth, Pune - 411030</p>
            <p><b>Website:</b> <br></br> <a href="https://sumbaranartsociety.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">https://sumbaranartsociety.com</a></p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-xs text-center">
          <p>&copy; {new Date().getFullYear()} sumbaran Art Society. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
