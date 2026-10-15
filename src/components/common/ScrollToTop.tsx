import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Target both main scrollable container and window
    const mainElement = document.querySelector('main');

    const handleScroll = () => {
      const mainScrollTop = mainElement ? mainElement.scrollTop : 0;
      const windowScrollTop = window.scrollY || document.documentElement.scrollTop;

      if (mainScrollTop > 300 || windowScrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Attach listeners
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const mainElement = document.querySelector('main');
    if (mainElement && mainElement.scrollTop > 0) {
      mainElement.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      title="Cuộn lên đầu trang"
      className={`fixed bottom-14 right-5 sm:right-8 z-40 p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 group ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
      } bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700/80 backdrop-blur-md shadow-emerald-900/5 dark:shadow-black/40 hover:shadow-xl hover:scale-110 active:scale-95`}
    >
      <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
      <span className="sr-only">Cuộn lên đầu trang</span>
    </button>
  );
};
