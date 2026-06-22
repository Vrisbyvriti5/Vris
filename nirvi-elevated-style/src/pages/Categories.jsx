import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCatalog } from '@/context/CatalogContext';
import { motion } from 'framer-motion';
import { toCategoryLabel } from '@/lib/product-taxonomy';

const catImages = {
  'bag charms': 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776801966915-642e71eb5421.webp',
  bracelets: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776802038465-ce424745ff0a.webp',
  caps: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776802118191-17e53dde457d.webp',
  keychains: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776802002812-11d3a1aff102.webp',
  'laptop sleeves': 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776802081435-52e3996ee7de.webp',
  pouches: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776801188346-bec94ada3de3.webp',
  totebags: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776802162190-fcff43302ba6.webp',
  flex: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1776801579818-504292d5650a.webp',
};

const Categories = () => {
  const { categories } = useCatalog();
  const cats = categories.filter(c => c !== 'All');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-[96px] md:pt-[104px] pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 md:mb-8">Categories</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {cats.map((cat, i) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "300px", amount: 0.01 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/shop?cat=${encodeURIComponent(cat)}`} className="block relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl group aspect-[16/9] transition-shadow duration-300">
                <img 
                  src={catImages[cat] || catImages.totebags} 
                  alt={toCategoryLabel(cat)} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  loading={i < 2 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center">
                  <h2 className="font-display text-3xl font-bold text-white tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">{toCategoryLabel(cat)}</h2>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Categories;
