import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import { useCatalog } from '@/context/CatalogContext';
import { useWishlist } from '@/context/WishlistContext';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { products, loading } = useCatalog();
  const { items } = useWishlist();
  const wishlisted = products.filter(p => items.includes(p.id));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-7xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827] mb-2">Wishlist</h1>
        <p className="text-sm text-[#6b7280] font-body mb-6 md:mb-10">Products you've saved for later.</p>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductSkeleton key={`skeleton-${i}`} index={i} />
            ))}
          </div>
        ) : wishlisted.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-dashed border-[#d1d5db] bg-white shadow-sm">
            <Heart size={48} className="mx-auto text-[#9ca3af] mb-4" />
            <p className="text-[#6b7280] mb-6 font-body">Your wishlist is currently empty</p>
            <Link to="/shop" className="inline-block px-8 py-3.5 bg-[#111827] rounded-xl text-white text-xs font-bold tracking-widest uppercase hover:bg-[#1f2937] transition-colors shadow-sm">
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {wishlisted.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
