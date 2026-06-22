import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const Sustainability = () => {
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
              Sustainability Practice
            </h1>
            <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-widest">
              VRISBYVRITI • A Commitment to Conscious Craft
            </p>
          </div>

          {/* Detailed Content */}
          <div className="space-y-10 text-[14px] leading-[1.8] text-[#4a4a4a]">
            
            <p>
              At VRISBYVRITI, sustainability is not a marketing buzzword or a seasonal trend; it is the fundamental framework through which we decide what to make, how to make it, and which materials to respect. We believe that fashion becomes truly responsible only when it slows down enough to notice its own impact on the planet and its people. Our practice is rooted in three core pillars: material rebirth, human-scale production, and practical longevity.
            </p>

            <p>
              We recognize that the global textile industry is one of the largest contributors to environmental degradation. By positioning ourselves as a "reborn" studio, we commit to finding value in materials that already have a history. For us, sustainability is a daily exercise in restraint, creative problem-solving, and honest communication with our community.
            </p>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">1. Material Rebirth and Upcycling</h2>
              <p>
                Our primary material focus is upcycled denim. We choose denim not just for its durability and timeless appeal, but because it is one of the most resource-intensive fabrics to produce from scratch. By repurposing high-quality post-consumer or post-industrial denim, we significantly reduce the water, energy, and chemical footprint of our products.
              </p>
              <p className="mt-4">
                Upcycling, however, is not an excuse for subpar quality. Every piece of salvaged material is carefully inspected, cleaned, and cut to ensure it meets our structural standards. We celebrate the unique character of upcycled fabrics—the subtle fades, the varied textures, and the story of past wear—integrating them into contemporary silhouettes that are built for modern utility.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">2. Human-Scale, Small-Batch Production</h2>
              <p>
                VRISBYVRITI operates on a human scale. We reject the unchecked volume and relentless cycles of fast fashion in favor of manageable production runs. This approach allows us to maintain a zero-inventory waste model, where we produce only what we believe our community needs. It also gives us the freedom to refine our designs based on real-world feedback rather than predicted trends.
              </p>
              <p className="mt-4">
                By keeping our production close to home and small in scale, we ensure that the artisan’s skill is visible in every final product. We treat craft as skilled labor, not as an invisible background function. This commitment to decent work and fair production timelines allows our makers to focus on the details that make a product last, rather than rushing to meet an artificial quota.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">3. Designing for Practical Longevity</h2>
              <p>
                A sustainable product is one that is used repeatedly and kept in circulation for as long as possible. We design every totebag, laptop sleeve, and pouch with function at the forefront. If a product does not serve a real-world purpose, it is not sustainable, regardless of the materials used. Our designs are intentionally versatile, meant to transition seamlessly between work, travel, and creative play.
              </p>
              <p className="mt-4">
                We also prioritize the "repair potential" of our pieces. We use high-quality hardware and construction techniques that are familiar and maintainable. By providing clear care guidance and encouraging our customers to "use, repair, and repeat," we aim to break the cycle of disposable consumption. A well-loved VRIS piece should only grow more beautiful and full of character over time.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">4. Transparency and Future Goals</h2>
              <p>
                We believe that sustainability is a process of continuous improvement, not a finished badge of perfection. We are honest about our current limitations and transparent about where we want to go. Our future goals include eliminating all single-use plastic from our packaging, introducing a formal repair and take-back program, and deepening our documentation of material origins.
              </p>
              <p className="mt-4">
                Our customers are an essential part of this practice. By choosing handcrafted over mass-produced, and by caring for your pieces with intention, you are helping to build a more sustainable fashion ecosystem. We invite you to join us in this journey—to ask questions, to share feedback, and to celebrate a brand that values every reborn thread.
              </p>
              <p className="mt-6 font-bold text-black uppercase tracking-wider">
                For care advice or material questions: <a href="mailto:project.vris@gmail.com" className="underline hover:text-[#e0b090] transition-colors">project.vris@gmail.com</a>
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

export default Sustainability;
