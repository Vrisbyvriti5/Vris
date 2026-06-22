import React from 'react';

/* ─── Banner images ─────────────────────────────────────────────────────────
   Replace these URLs when final assets are ready.
   Banner 1: 1983 × 80   |   Banner 2: 1983 × 99                           */
const BANNERS = [
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758768203-e8e53ac921c8-bannerbar.webp',
    alt: 'VRIS promotional banner',
    width: 1983,
    height: 80,
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758768252-bcfbd1654880-Bannerbar2.webp',
    alt: 'VRIS promotional banner',
    width: 1983,
    height: 99,
  },
];

const BannerSection = () => (
  <div className="mt-8 flex w-full flex-col items-center space-y-1.5">
    {BANNERS.map((banner, idx) => (
      <div
        key={idx}
        className="w-full overflow-hidden"
        style={{ aspectRatio: `${banner.width} / ${banner.height}` }}
      >
        <img
          src={banner.src}
          alt={banner.alt}
          width={banner.width}
          height={banner.height}
          className="h-full w-full object-cover object-center transition-transform duration-1000 ease-in-out hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>
    ))}
  </div>
);

export default BannerSection;
