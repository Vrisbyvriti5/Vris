import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Percent, Clock, Star } from 'lucide-react';

const Benefits = () => {
  const cards = [
    { icon: Truck, title: 'Fast & Free Delivery', desc: 'No minimum order value. Get your essentials delivered faster and absolutely free.' },
    { icon: Percent, title: 'Extra Discounts', desc: 'Enjoy flat discounts and exclusive promotional codes available only to members.' },
    { icon: Clock, title: 'Early Access', desc: 'Be the first to shop our highly anticipated drops 24 hours before everyone else.' },
    { icon: Star, title: 'VIP Experience', desc: 'Priority customer support, surprise gifts with orders, and an elevated unboxing experience.' },
  ];

  return (
    <section className="bg-gray-50 py-12 md:py-16 px-5 sm:px-8 md:px-12 lg:px-16 border-b border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px" }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Member Exclusives</h2>
          <p className="text-muted-foreground font-body max-w-xl mx-auto text-sm md:text-base">Everything you need to upgrade your shopping experience with Nirvi.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 hover:-translate-y-1 hover:shadow-lg hover:border-[#e0b090]/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#e0b090]/10 flex items-center justify-center mb-5 group-hover:bg-[#e0b090]/20 transition-colors">
                <card.icon className="text-[#e0b090]" size={20} />
              </div>
              <h3 className="text-lg md:text-xl font-display font-bold text-foreground mb-2">{card.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-body leading-relaxed group-hover:text-gray-600 transition-colors">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
