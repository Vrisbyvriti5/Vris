import React from 'react';
import { Link } from 'react-router-dom';

/* ─── 8 categories with 1:1 images ─────────────────────────────────────────
   Add a 9th+ item and the row will scroll horizontally on smaller screens. */
const CATEGORIES = [
  {
    slug: 'totebags',
    label: 'Totebags',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758994067-18f20fe07328-1.webp',
  },
  {
    slug: 'bracelets',
    label: 'Bracelets',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993900-beb321c9598d-7.webp',
  },
  {
    slug: 'caps',
    label: 'Caps',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758994039-bdc5ac1f5113-2.webp',
  },
  {
    slug: 'keychains',
    label: 'Keychains',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993840-1c94af79900d-8.webp',
  },
  {
    slug: 'laptop sleeves',
    label: 'Laptop Sleeves',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993954-28b9451f558f-5.webp',
  },
  {
    slug: 'pouches',
    label: 'Pouches',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993927-294887969171-6.webp',
  },
  {
    slug: 'bag charms',
    label: 'Bag Charms',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758994010-93cc072dba29-3.webp',
  },
  {
    slug: 'flex',
    label: 'Flex',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993981-4060f07f2750-4.webp',
  },
];

const CategoryStrip = () => (
  <div className="mt-6 w-full px-4 md:mt-8">
    {/* Hide scrollbar for WebKit */}
    <style>{`.category-strip::-webkit-scrollbar { display: none; }`}</style>

    <div
      className="category-strip flex items-start justify-start md:justify-center gap-4 overflow-x-auto md:overflow-hidden pb-2 pt-2 snap-x snap-mandatory"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          to={`/shop?cat=${encodeURIComponent(cat.slug)}`}
          className="group flex min-w-[calc(33.33%-11px)] md:min-w-0 md:flex-1 flex-col items-center snap-center first:ml-0"
        >
          {/* Rounded square background box */}
          <div
            className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl transition-transform duration-300 ease-in-out group-hover:-translate-y-1.5"
            style={{ backgroundColor: '#f3f3f3' }}
          >
            <img
              src={cat.image}
              alt={cat.label}
              className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>

          {/* Category name */}
          <span className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground/80 md:text-sm">
            {cat.label}
          </span>
        </Link>
      ))}
    </div>
  </div>
);

export default CategoryStrip;
