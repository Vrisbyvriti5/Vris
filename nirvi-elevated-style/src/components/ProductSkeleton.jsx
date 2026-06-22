import React from 'react';
import { motion } from 'framer-motion';

const ProductSkeleton = ({ index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden h-full min-h-[420px]"
    >
      {/* Image Area */}
      <div className="relative bg-gray-50 p-2.5 sm:p-3">
        <div className="aspect-square w-full rounded-xl bg-gray-200 animate-pulse" />
      </div>

      {/* Info Area */}
      <div className="flex flex-col flex-1 px-3 pb-3 pt-2 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-3.5 w-2/3 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="flex gap-px">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 w-3 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Price Row */}
        <div className="pt-1 flex items-baseline gap-2">
          <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-1/4 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Badge */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="flex-1 min-h-1.5" />

        {/* CTA Button */}
        <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </motion.div>
  );
};

export default ProductSkeleton;
