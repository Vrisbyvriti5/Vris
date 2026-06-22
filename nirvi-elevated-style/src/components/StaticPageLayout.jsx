import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const StaticPageLayout = ({ eyebrow, title, lead, children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-6xl"
        >
          <header className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9ca3af]">{eyebrow}</p>
            ) : null}
            <h1 className="mt-3 font-display text-3xl font-bold text-[#111827] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {lead ? (
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#4b5563] font-body sm:text-lg">
                {lead}
              </p>
            ) : null}
          </header>

          <div className="mt-6 space-y-5 text-[#4b5563] leading-7 font-body">
            {children}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default StaticPageLayout;
