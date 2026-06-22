import React from 'react';
import { motion } from 'framer-motion';

const ProductDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        {/* Back link skeleton */}
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-6" />

        <div className="grid gap-8 py-6 md:grid-cols-2 md:gap-12 md:py-8">
          {/* Left side - Image gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {/* Main image */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="w-full aspect-square bg-muted animate-pulse" />
            </div>

            {/* Image thumbnails */}
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          </motion.div>

          {/* Right side - Product details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-6 w-full bg-muted animate-pulse rounded" />
            </div>

            {/* Rating */}
            <div className="h-10 w-48 bg-muted animate-pulse rounded" />

            {/* Price section */}
            <div className="pt-4 border-t border-border/50 space-y-3">
              <div className="h-8 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-5 w-56 bg-muted animate-pulse rounded" />
            </div>

            {/* Quantity selector */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-40 bg-muted animate-pulse rounded" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <div className="flex-1 h-14 bg-muted animate-pulse rounded-md" />
              <div className="flex-1 h-14 bg-muted animate-pulse rounded-md" />
              <div className="w-14 h-14 bg-muted animate-pulse rounded-md" />
            </div>

            {/* Notify button */}
            <div className="h-12 w-full bg-muted animate-pulse rounded-md" />

            {/* Delivery options */}
            <div className="pt-4 border-t border-border/50 space-y-4">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-5 w-full bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>

            {/* Best offers */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reviews section skeleton */}
        <section className="py-12 border-t border-border/50 mt-10">
          <div className="grid gap-12 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
