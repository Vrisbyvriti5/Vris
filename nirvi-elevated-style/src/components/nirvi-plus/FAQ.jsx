import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: "What is NirviPlus?", a: "NirviPlus is our premium membership program designed to give our most loyal customers exclusive perks, faster shipping, and early access to drops." },
  { q: "How does it work?", a: "Once you subscribe, your account is immediately upgraded. All benefits are automatically applied when you browse or checkout while logged in." },
  { q: "Can I cancel anytime?", a: "Yes, there are no long-term commitments. You can cancel your subscription anytime from your profile settings." },
  { q: "Is delivery really free?", a: "Yes! NirviPlus members get absolutely free delivery on all orders, with no minimum purchase required." },
  { q: "Do I get exclusive products?", a: "While we don't lock products entirely, Plus members get 24-hour early access to new collections, meaning you get first pick before they sell out." },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-gray-50 py-12 md:py-16 px-5 sm:px-8 md:px-12 lg:px-16 border-b border-border">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px" }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground font-body text-sm md:text-base">Everything you need to know about the membership.</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ delay: i * 0.05 }}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-[#e0b090]/30 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-display font-bold text-foreground text-sm md:text-base">{faq.q}</span>
                <ChevronDown 
                  className={`text-gray-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-[#e0b090]' : ''}`} 
                  size={18} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-4 text-muted-foreground font-body leading-relaxed text-sm border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
