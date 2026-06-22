import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const ComparisonTable = () => {
  const features = [
    { name: 'Free Delivery', free: false, plus: true },
    { name: 'Early Access to Drops', free: false, plus: true },
    { name: 'Exclusive Discounts', free: false, plus: true },
    { name: 'Premium Support', free: false, plus: true },
    { name: 'Faster Shipping', free: false, plus: true },
    { name: 'Standard Products', free: true, plus: true },
  ];

  return (
    <section className="bg-white py-12 md:py-16 pt-16 px-5 sm:px-8 md:px-12 lg:px-16 border-b border-border relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px" }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Why upgrade to NirviPlus?</h2>
          <p className="text-muted-foreground font-body text-sm md:text-base max-w-xl mx-auto">Compare the benefits and see why our members love the Plus experience.</p>
        </motion.div>

        <div className="w-full">
          <table className="w-full text-sm md:text-base border-collapse">
            <thead>
              <tr>
                <th className="p-3 pt-6 text-left border-b border-gray-200 text-gray-500 font-body font-medium w-1/2">Feature</th>
                <th className="p-3 pt-6 text-center border-b border-gray-200 text-gray-800 font-display font-bold w-1/4">Free</th>
                <th className="p-3 pt-6 text-center border-b border-[#e0b090]/30 text-[#e0b090] font-display font-bold w-1/4 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#e0b090] text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap shadow-sm z-20">
                    Best Value
                  </div>
                  <span className="relative z-10">Plus</span>
                  <div className="absolute inset-x-0 -top-3 bottom-[-1000px] bg-gradient-to-b from-[#e0b090]/5 to-transparent border-x border-t border-[#e0b090]/10 rounded-t-xl -z-10" />
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <motion.tr 
                  key={f.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "100px" }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 md:p-4 text-gray-700 font-body border-b border-gray-100">
                    {f.name}
                  </td>
                  <td className="p-3 md:p-4 text-center border-b border-gray-100">
                    {f.free ? (
                      <Check className="mx-auto text-gray-400" size={18} />
                    ) : (
                      <X className="mx-auto text-gray-300" size={18} />
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center border-b border-[#e0b090]/10 relative">
                    {f.plus ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#e0b090]/10 flex items-center justify-center mx-auto">
                        <Check className="text-[#e0b090]" size={16} />
                      </div>
                    ) : (
                      <X className="mx-auto text-gray-300" size={16} />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
