import React from 'react';
import { Link } from 'react-router-dom';

const HERO_SLIDE = {
  src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534193-3e94c8879e3d-SLIDERS(2).webp',
  alt: 'VRIS Collection — Slide 1',
  to: '/shop',
};

const HeroSection = () => {
  return (
    <div className="relative w-full h-[60vh] md:h-[75vh] lg:h-[85vh] overflow-hidden bg-gray-100 mt-14 md:mt-16">
      <Link to={HERO_SLIDE.to} className="block w-full h-full relative group">
        <img
          src={HERO_SLIDE.src}
          alt={HERO_SLIDE.alt}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          fetchpriority="high"
        />
        {/* Optional overlay for better text contrast if you ever add text */}
        <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:bg-black/20" />
      </Link>
    </div>
  );
};

export default HeroSection;
