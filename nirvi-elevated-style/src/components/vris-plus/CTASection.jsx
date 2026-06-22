import React from 'react';
import { motion } from 'framer-motion';

const CTASection = () => {
  return (
    <section className="bg-white py-16 md:py-24 px-5 sm:px-8 md:px-12 lg:px-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#e0b090]/5 to-white pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e0b090]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px" }}
          className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight"
        >
          Ready to upgrade your shopping experience?
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px" }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 rounded-full bg-[#e0b090] text-white font-bold text-xs md:text-sm tracking-widest uppercase hover:bg-[#d6a382] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Join VRISPlus Now
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
