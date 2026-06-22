import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-background py-16 flex items-center justify-center border-b border-border">
      <div className="absolute inset-0 bg-[url('https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777408935994-8473cae28cd3-ChatGPT+Image+Apr+29%2C+2026%2C+02_01_48+AM.webp')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
      
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-12">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1.5 rounded-full bg-[#e0b090]/10 border border-[#e0b090]/20 text-[#e0b090] text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
        >
          Introducing
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight"
        >
          VRIS<span className="text-[#e0b090] font-display">Plus</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-body mb-8"
        >
          Elevate your shopping experience. Unlock exclusive perks, free delivery, and early access to our most sought-after drops.
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-8 py-3.5 rounded-full bg-[#e0b090] text-white font-bold text-xs tracking-widest uppercase hover:bg-[#d6a382] transition-all shadow-[0_4px_14px_rgba(224,176,144,0.3)] hover:shadow-[0_6px_20px_rgba(224,176,144,0.4)]"
        >
          Explore Benefits
        </motion.button>
      </div>
    </section>
  );
};

export default HeroSection;
