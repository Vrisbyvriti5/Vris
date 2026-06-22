import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/nirvi-plus/HeroSection';
import ComparisonTable from '@/components/nirvi-plus/ComparisonTable';
import Benefits from '@/components/nirvi-plus/Benefits';
import PricingCard from '@/components/nirvi-plus/PricingCard';
import FAQ from '@/components/nirvi-plus/FAQ';
import CTASection from '@/components/nirvi-plus/CTASection';

const NirviPlus = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-[#e0b090]/30">
      <Navbar />
      
      <main>
        <HeroSection />
        <ComparisonTable />
        <Benefits />
        <PricingCard />
        <FAQ />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default NirviPlus;
