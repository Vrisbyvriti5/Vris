import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-[#2d2d2d]">
      <Navbar />
      
      <main className="mx-auto max-w-5xl px-6 pt-32 pb-24 sm:px-12 md:px-16 lg:px-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Centered Heading */}
          <div className="text-center mb-16 border-b border-gray-100 pb-10">
            <h1 className="text-[15px] font-black uppercase tracking-[0.4em] text-black">
              Our Story
            </h1>
            <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-widest">
              VRISBYVRITI • The Artisan Journey
            </p>
          </div>

          {/* Detailed Content */}
          <div className="space-y-10 text-[14px] leading-[1.8] text-[#4a4a4a]">
            
            <p>
              At VrisbyVriti, we believe fashion should feel personal. Every piece we create is thoughtfully designed to blend timeless style with modern versatility, so you can wear it with confidence, season after season. Our collections are inspired by women who love effortless elegance, quality craftsmanship, and clothing that adapts to their unique style.
            </p>

            <p>
              What makes us different is our commitment to customization. We understand that everyone has their own preferences, which is why many of our designs can be customized in your preferred color and, where possible, tailored to your requirements. We want every outfit to feel like it was made especially for you.
            </p>

            <p>
              From everyday essentials to statement pieces, each garment is crafted with attention to detail, premium fabrics, and flattering silhouettes. At VrisbyVriti, we're not just creating clothes, we're creating pieces you'll reach for again and again because it's never a one-time thing.
            </p>

            <p className="mt-10 italic text-gray-500 border-t border-gray-100 pt-8">
              VRISBYVRITI is coordinated through our creative studio based in Panipat, Haryana. We are a team of dreamers and makers dedicated to the art of the slow stitch.
            </p>

          </div>
          
          <div className="mt-20 pt-10 border-t border-gray-100 text-[12px] text-gray-400 text-center tracking-[0.2em] uppercase font-medium">
            © {new Date().getFullYear()} VRISBYVRITI. ALL RIGHTS RESERVED.
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
