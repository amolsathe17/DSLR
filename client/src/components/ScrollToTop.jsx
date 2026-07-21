import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // 1. Auto page scroll to top on route change
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scroll on navigation
    });
  }, [pathname]);

  // 2. Monitor scroll position to show/hide the floating button
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Smooth scroll back to top on click
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          type="button"
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-800/80 shadow-xl backdrop-blur-md hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 animate-in fade-in zoom-in-75 duration-200 cursor-pointer"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp size={20} className="stroke-[2.5]" />
        </button>
      )}
    </>
  );
}
