import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/vris-plus/HeroSection';
import ComparisonTable from '@/components/vris-plus/ComparisonTable';
import Benefits from '@/components/vris-plus/Benefits';
import PricingCard from '@/components/vris-plus/PricingCard';
import FAQ from '@/components/vris-plus/FAQ';
import CTASection from '@/components/vris-plus/CTASection';

const VRISPlus = () => {
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

export default VRISPlus;
