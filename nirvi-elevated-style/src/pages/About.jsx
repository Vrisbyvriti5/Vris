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
              VRISBYVRITI is not just a fashion label; it is a creative movement born out of a profound respect for the lifecycle of materials and the enduring power of manual craftsmanship. Founded with the vision of bridging the gap between historical craft and contemporary urban life, the brand has evolved from a small student-led initiative into a dedicated studio focused on high-utility, handcrafted fashion essentials.
            </p>

            <p>
              Our journey began with a simple observation: the modern fashion industry moves at a pace that often disregards the story behind the stitch. Mass production has made style accessible, but at the cost of character, durability, and environmental responsibility. VRISBYVRITI was established to provide an alternative—a slower, more intentional way of making things that people actually use, love, and keep for years.
            </p>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">The Philosophy of Rebirth</h2>
              <p>
                The name "REBORN THREADS" reflects our core commitment to upcycling and material preservation. We believe that fashion becomes truly responsible when it stops seeing materials as disposable and starts seeing them as a medium for transformation. A discarded panel of high-quality denim is not waste; to us, it is a material with history, structure, and a unique patina that cannot be replicated in a factory.
              </p>
              <p className="mt-4">
                By integrating upcycled denim, artisanal wool, and expressive Flex fabrics, we create products that carry a narrative. Whether it is a totebag, a laptop sleeve, or a simple bag charm, every VRIS piece is a result of meticulous planning where utility is the foundation and design is the ultimate expression of that utility.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">Craft Over Decoration</h2>
              <p>
                In our studio, craft is never treated as a decorative afterthought. It is our central method of making. We believe that the human touch adds a dimension of warmth and presence that machines simply cannot achieve. This is why small differences in texture, stitch pattern, and finish are celebrated as part of the product’s DNA.
              </p>
              <p className="mt-4">
                Our production is intentionally kept in small batches. This manageable scale allows us to constantly refine our patterns, test the durability of our finishes, and respond directly to the needs and feedback of our community. It ensures that every product leaving our hands meets a standard of quality that we are proud to stand behind. We are building a brand where the artisan is visible in the final product.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">A Community of Conscious Consumers</h2>
              <p>
                VRISBYVRITI serves a diverse community of students, professionals, artists, and creators who value design with a conscience. Our customers are people who look for more than just a brand name; they look for a connection to the products they carry daily. They understand that a well-made accessory is an investment in both personal style and global responsibility.
              </p>
              <p className="mt-4">
                We maintain an honest and grounded conversation with our audience. We don't hide behind slogans; instead, we show our process, share our care instructions, and encourage a culture of use, repair, and repeat wear. Our goal is to empower our customers to make choices that are both stylish and sustainable, without ever compromising on the practical needs of modern life.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">The Path Ahead</h2>
              <p>
                As we look to the future, VRISBYVRITI is focused on deepening its roots in artisan-led retail. We are continuously exploring new material stories and expanding our techniques to include more complex handcrafted details. While we are growing, our commitment to a human-scale business remains unchanged.
              </p>
              <p className="mt-4">
                We believe that the future of fashion lies in the bridge between tradition and innovation. By respecting the past through upcycling and embracing the future through contemporary design, we are building a catalog of essentials that are truly made to last. Thank you for being a part of our story and for choosing a brand that values every thread.
              </p>
            </div>

            <p className="mt-10 italic text-gray-500 border-t border-gray-100 pt-8">
              VRISBYVRITI is coordinated through our creative studio based at Bennett University, Greater Noida. We are a team of dreamers and makers dedicated to the art of the slow stitch.
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
