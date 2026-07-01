import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const Careers = () => {
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
              Careers and Collaborations
            </h1>
            <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-widest">
              VRISBYVRITI • Join Our Creative Movement
            </p>
          </div>

          {/* Detailed Content */}
          <div className="space-y-10 text-[14px] leading-[1.8] text-[#4a4a4a]">
            
            <p>
              VRISBYVRITI is built by people who care deeply about materials, design, artisanal craft, and honest brand building. As a young and rapidly evolving fashion studio, we are constantly on the lookout for thoughtful collaborators, dedicated interns, campus creatives, and professional makers who want to help shape the future of slow fashion.
            </p>

            <p>
              Working with us means becoming part of a team that values intentionality over volume. We don't just fill roles; we build partnerships with individuals who are curious, organized, and comfortable with hands-on work. If you believe that fashion should be a bridge between heritage and contemporary life, VRISBYVRITI may be the right place for you to grow.
            </p>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">A Multi-Disciplinary Environment</h2>
              <p>
                Careers at VRISBYVRITI are not limited to conventional, siloed job descriptions. Because the brand is still being shaped, meaningful work often sits at the intersection of multiple functions. A product design idea may require material research, artisanal experimentation, photography, copywriting, and customer experience planning before it is ready for our Platform.
              </p>
              <p className="mt-4">
                We value people who can think across these steps and who maintain an unwavering focus on the small details. Whether you are helping to refine a pattern, styling a campaign, or coordinating a small-batch fulfillment, your contribution is visible and vital to the brand's integrity. We provide an environment where creative thinking is supported by operational rigor.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">What We Look For</h2>
              <p>
                We look for individuals who can combine artistic taste with personal responsibility. Strong visual instincts are valuable, but they matter most when they are paired with consistent follow-through and a commitment to quality. We appreciate applicants who show us how they think—not just their final portfolio pieces, but the process, the failures, and the refinements that led to the end result.
              </p>
              <p className="mt-4">
                Initiative and a willingness to learn are more important to us than years of polished corporate experience. We welcome students and early-career professionals who are eager to take ownership of projects and who can communicate their ideas clearly and honestly. If you can notice a small issue before it becomes a problem and if you keep your promises realistic, you will thrive in our studio.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">Collaborations and Partnerships</h2>
              <p>
                VRISBYVRITI grows through community as much as it does through commerce. We are open to project-based partnerships with makers, artisans, photographers, stylists, writers, and sustainability advocates who share our vision. If you have a specific proposal that aligns with our material-led philosophy, we would love to explore what we can create together.
              </p>
              <p className="mt-4">
                We also run a Campus Ambassador program designed for students who want to represent a conscious brand within their university networks. This program is focused on community building, storytelling, and gathering real-world feedback from a generation that values sustainable style. It is an opportunity to gain hands-on experience in brand marketing and operations.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">Current Areas of Interest</h2>
              <ul className="list-disc pl-6 space-y-4">
                <li><strong>Design & Production:</strong> Exploring new upcycling techniques, pattern making, and small-batch manufacturing coordination.</li>
                <li><strong>Content & Creative:</strong> Styling, campaign photography, editorial writing, and digital storytelling that respects the artisan's journey.</li>
                <li><strong>Operations & Growth:</strong> Logistics coordination, customer experience management, and community engagement.</li>
                <li><strong>Artisan Collaborations:</strong> Working with local craftspeople to integrate traditional techniques into contemporary accessories.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">Application Process</h2>
              <p>
                To apply for a role or propose a collaboration, please send a short introduction of who you are and why you want to work with VRISBYVRITI. Include your availability, any relevant links to your work (portfolio, social handles, or projects), and a brief note on what you believe you can bring to our studio.
              </p>
              <p className="mt-4">
                For collaboration proposals, please include a clear purpose, the expected format of the project, a general timeline, and what you believe the mutual benefit will be. We review every application and will reach out if we see a potential fit for current or future projects.
              </p>
              <p className="mt-6 font-bold text-black uppercase tracking-wider">
                Direct all inquiries to: <a href="mailto:Vrisbyvriti5@gmail.com" className="underline hover:text-[#e0b090] transition-colors">Vrisbyvriti5@gmail.com</a>
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

export default Careers;
