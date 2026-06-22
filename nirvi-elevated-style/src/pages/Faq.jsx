import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqData = [
  {
    question: 'What is the philosophy behind VRISBYVRITI?',
    answer: 'VRISBYVRITI is built on the core principle of material rebirth—the idea that fashion should be a bridge between the past and the future. We specialize in transforming high-quality, pre-existing materials like upcycled denim and sustainable wool into contemporary fashion essentials. Our philosophy rejects the "fast fashion" model of disposable clothing, focusing instead on intentional, small-batch production that values every stitch. We believe that an accessory is most beautiful when it carries a story of craftsmanship and responsibility, serving as a functional yet expressive companion for your daily urban life.'
  },
  {
    question: 'Are your products truly handmade, and why does that matter?',
    answer: 'Yes, every product at VRISBYVRITI is handcrafted and finished in our creative studio. Unlike mass-produced items made on assembly lines, our pieces are touched by human hands at every stage of production. This matters because it ensures a level of attention to detail that machines simply cannot replicate. Hand-making allows us to notice and celebrate the natural variations in material grain and stitch patterns, making each product unique. This artisan-led approach also means we can maintain higher quality control, as every bag, sleeve, or pouch is individually inspected for durability and finish before it ever reaches you.'
  },
  {
    question: 'What kind of upcycled materials do you use in your collections?',
    answer: 'Our primary focus is on upcycled denim, which we source based on its quality, weight, and character. Denim is one of the most resource-intensive fabrics to produce, so by repurposing it, we significantly reduce our environmental footprint. We also work with sustainable wool for our decorative and softer accessories, as well as expressive Flex fabrics for products that require a more urban, street-style aesthetic. We are constantly experimenting with new "material stories," looking for ways to give a second life to high-grade textile offcuts and post-consumer fabrics that would otherwise go to waste.'
  },
  {
    question: 'How should I care for my handcrafted denim and wool accessories?',
    answer: 'To ensure your VRISBYVRITI pieces last a lifetime, we recommend a "care and repair" mindset. For denim products, spot cleaning with a soft cloth and a mild, eco-friendly detergent is always preferable to full immersion. If you must wash the entire item, hand wash it gently in cold water and air-dry it in the shade to prevent color fading and maintain the fabric\'s structural integrity. For wool-based charms and accessories, avoid harsh scrubbing or exposure to heat. We suggest storing all your items in a dry, cool place and avoiding overstuffing bags, as excessive weight can stress the seams and zippers over time.'
  },
  {
    question: 'What is the standard delivery timeline for my order?',
    answer: 'Most orders are processed within our 1-2 day quality-check window. Once dispatched, standard delivery within major metropolitan areas typically takes 3 to 5 working days, while other regions may take 5 to 7 working days. Because many of our products are finished in small batches or may involve custom artisan details, there are times when production takes slightly longer to ensure the item meets our standards. If your order requires extra attention, our team will proactively reach out to you with a specific, realistic timeline. We prioritize transparent and honest communication over automated, often inaccurate delivery promises.'
  },
  {
    question: 'Do you offer customization for gifts or corporate orders?',
    answer: 'We love working on unique projects! We offer customization on selected products depending on our current production capacity and the complexity of the request. Whether you want to add initials to a totebag, request a specific color palette for a corporate gift, or develop a bespoke accessory for a special event, we are open to collaboration. Please reach out to us through our contact page with your requirements, including artwork direction and quantity. We will review your proposal and get back to you with a feasibility report, pricing, and an estimated artisan timeline for the project.'
  },
  {
    question: 'What is your return and exchange policy for handcrafted items?',
    answer: 'We accept return and exchange requests within 7 days of delivery for all eligible, unused products. To qualify for a return, the item must be in its original condition with all tags and packaging intact. Please note that since our products are handcrafted using upcycled materials, minor variations in texture, color, and stitch are considered part of the artisan charm and are not classified as defects. However, if there is a verified quality issue or if you received the wrong product, we will facilitate a smooth return or exchange process. Customized items made to specific user requirements are generally not eligible for return unless a structural defect is present.'
  },
  {
    question: 'How does VRISBYVRITI support sustainable communities?',
    answer: 'Our commitment to sustainability extends beyond just materials; it includes the people who make and use our products. We treat craft as skilled labor and ensure that our production timelines respect the artisan’s pace. We also engage heavily with campus communities through our ambassador programs and workshops, encouraging a new generation of creators to think about "material rebirth" in their own lives. By choosing VRIS, you are supporting a business model that values human scale over industrial volume, helping us build a community that prioritizes responsible consumption and the preservation of artisanal techniques.'
  }
];

const AccordionItem = ({ question, answer, isOpen, onClick, isFirst, isLast }) => {
  return (
    <div className={`overflow-hidden border-x border-t last:border-b border-gray-200 transition-all duration-300 ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${isOpen ? 'bg-[#f3f4f6]' : 'bg-[#f9fafb]'}`}>
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-all"
        aria-expanded={isOpen}
      >
        <span className={`text-[13px] font-bold uppercase tracking-widest transition-colors ${isOpen ? 'text-[#e0b090]' : 'text-black'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={isOpen ? 'text-[#e0b090]' : 'text-gray-400'}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-[14px] leading-[1.8] text-[#555555] border-t border-gray-200/50 pt-4 bg-white/50">
              <p>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-widest">
              VRISBYVRITI • Helpful Guidance for our Community
            </p>
          </div>

          {/* Accordion List */}
          <div className="mx-auto max-w-4xl shadow-sm">
            {faqData.map((item, index) => (
              <AccordionItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === index}
                onClick={() => handleToggle(index)}
                isFirst={index === 0}
                isLast={index === faqData.length - 1}
              />
            ))}
          </div>

          {/* Contact Support Referral */}
          <div className="mt-20 rounded-2xl bg-[#f9fafb] p-8 text-center border border-gray-100">
            <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-3">Still have questions?</h3>
            <p className="text-[14px] text-gray-500 mb-6">
              Our team is ready to provide specific updates regarding your order, customization ideas, or material care.
            </p>
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-full bg-black px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-800 active:scale-95 shadow-lg shadow-black/5"
            >
              Get in touch
            </a>
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

export default Faq;
