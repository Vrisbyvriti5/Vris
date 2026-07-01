import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const ShippingReturns = () => {
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
              Shipping, Returns and Care
            </h1>
            <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-widest">
              VRISBYVRITI • Quality Assurance and Customer Support
            </p>
          </div>

          {/* Detailed Content */}
          <div className="space-y-10 text-[14px] leading-[1.8] text-[#4a4a4a]">
            
            <p>
              By transacting on our Platform, you agree to the terms set forth below. We strive to provide clear timelines and practical solutions for every order.
            </p>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">1. Shipping</h2>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-[#4a4a4a]">
                <li>Orders are processed within 2–5 business days.</li>
                <li>Customized orders may take 5–10 business days to dispatch.</li>
                <li>Ships within 5-7 working days.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">2. Returns are accepted only if:</h2>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-[#4a4a4a]">
                <li>The item is damaged upon delivery.</li>
                <li>You receive the wrong item.</li>
                <li>You receive the wrong size (if it differs from what you ordered).</li>
                <li>The product has a manufacturing defect.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">3. Returns are not accepted for:</h2>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-[#4a4a4a]">
                <li>Change of mind.</li>
                <li>Incorrect size ordered by the customer (unless we sent the wrong size).</li>
                <li>Color variations due to screen settings.</li>
                <li>Customized or personalized orders.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">4. Support and Assistance</h2>
              <p>
                Need help with your order? Feel free to DM us or contact our support team—we're always happy to help!
              </p>
              <p className="mt-4 font-bold text-black uppercase tracking-wider">
                Support Email: <a href="mailto:Vrisbyvriti5@gmail.com" className="underline hover:text-[#e0b090] transition-colors">Vrisbyvriti5@gmail.com</a>
              </p>
              <p className="mt-1 font-bold text-black uppercase tracking-wider">
                Helpline: +91 86071 87086
              </p>
            </div>

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

export default ShippingReturns;
