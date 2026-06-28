import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollPos, setLastScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      if (currentScrollPos > lastScrollPos && currentScrollPos > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollPos]);

  const textItems = Array.from({ length: 8 });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 40, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-[#F0D0B0] text-[#1A1A1A] w-full overflow-hidden border-b border-black/5 flex items-center shrink-0 origin-top"
        >
          <div className="flex w-full h-full items-center overflow-hidden">
            <div className="flex min-w-full shrink-0 items-center justify-around gap-24 pr-24 animate-marquee">
              {textItems.map((_, i) => (
                <span key={i} className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-[0.15em] uppercase flex items-center gap-2 whitespace-nowrap">
                  🎉 VRISBYVRITI OFFICIALLY LIVE
                </span>
              ))}
            </div>
            <div className="flex min-w-full shrink-0 items-center justify-around gap-24 pr-24 animate-marquee" aria-hidden="true">
              {textItems.map((_, i) => (
                <span key={`dup-${i}`} className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-[0.15em] uppercase flex items-center gap-2 whitespace-nowrap">
                  🎉 VRISBYVRITI OFFICIALLY LIVE
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementBar;
