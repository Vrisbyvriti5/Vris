import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, StarHalf, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPriceINR, getProductPricing } from '@/lib/pricing';
import { getEntityStock, isOutOfStock } from '@/lib/stock';
import { useToast } from '@/components/ui/use-toast';

const ADD_TO_CART_TOAST_DURATION = 1500;

// ─── Star Rating Component ──────────────────────────────────────────
const StarRating = ({ rating = 0, reviews = 0 }) => {
  const hasRating = rating > 0;
  const fullStars = Math.floor(rating);
  const hasHalf = hasRating && rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  // No ratings at all — show muted message
  if (!hasRating) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={`e-${i}`} size={12} className="text-gray-300" />
          ))}
        </div>
        <span className="text-[11px] text-gray-400 italic font-body">No ratings yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center gap-px">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`f-${i}`} size={12} className="fill-emerald-500 text-emerald-500" />
        ))}
        {hasHalf && <StarHalf size={12} className="fill-emerald-500 text-emerald-500" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`e-${i}`} size={12} className="text-gray-300" />
        ))}
      </div>
      <span className="text-[11px] font-bold text-emerald-600">{rating.toFixed(1)} ★</span>
      <span className="text-[11px] text-gray-400">
        ({reviews > 0 ? reviews.toLocaleString('en-IN') : '0'})
      </span>
    </div>
  );
};

// ─── Main ProductCard ───────────────────────────────────────────────
const ProductCard = ({ product, index = 0, ctaLabel = 'Add to Cart', eagerCount = 15 }) => {
  const { items, addItem, increment, decrement, removeItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const productId = String(product?.id ?? product?.product_id ?? '');
  const cartItem = items.find((i) => String(i.id) === productId);
  const primaryImage = product.image || product.images?.[0] || '/placeholder.svg';
  const galleryImages = product.images || (product.image ? [product.image] : ['/placeholder.svg']);
  const pricing = getProductPricing(product);
  const stockValue = getEntityStock(product, 0);
  const outOfStock = isOutOfStock(product);
  const reachedStockLimit = Boolean(cartItem && !outOfStock && cartItem.quantity >= stockValue);

  // ─── Image Looper Effect ───
  useEffect(() => {
    let interval;
    if (isHovered && galleryImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
      }, 2500); // Change every 2.5 seconds as requested
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, galleryImages.length]);

  // Use real rating only — no fake/random fallbacks
  const rawRating = product.rating ?? product.average_rating ?? product.avg_rating ?? product.averageRating ?? 0;
  const rating = Number(rawRating) || 0;
  const reviews = product.reviewCount ?? product.reviews ?? product.review_count ?? product.total_reviews ?? 0;
  const savingsAmount = pricing.hasDiscount ? pricing.mrp - pricing.finalPrice : 0;

  const navigateToProduct = () => {
    if (!productId) {
      return;
    }

    navigate(`/product/${productId}`);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToProduct();
    }
  };

  const handleWishlistToggle = (event) => {
    event.stopPropagation();
    toggle(productId);
  };

  const handleNotifyMeClick = (event) => {
    event.stopPropagation();
    handleNotifyMe();
  };

  const handleAddToCartClick = async (event) => {
    event.stopPropagation();
    await handleAddToCart();
  };

  const handleDecrement = (event) => {
    event.stopPropagation();
    decrement(productId);
  };

  const handleIncrement = (event) => {
    event.stopPropagation();
    increment(productId);
  };

  const handleRemoveFromCart = (event) => {
    event.stopPropagation();
    removeItem(productId);
  };

  const handleNotifyMe = () => {
    toast({
      title: 'Notify Me is coming soon',
      description: `${product.name} is currently unavailable. Restock alerts will be available soon.`,
    });
  };

  const handleAddToCart = async () => {
    if (isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);

    try {
      const wasAdded = await addItem({
        id: productId,
        name: product.name,
        price: pricing.finalPrice,
        image: primaryImage,
        category: product.category,
        stock: stockValue,
      });

      if (wasAdded) {
        toast({
          title: 'Added to cart',
          description: `${product.name} is now in your cart.`,
          duration: ADD_TO_CART_TOAST_DURATION,
        });
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ─── Visibility + image preloading ───
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(index < eagerCount);
  const [imgLoaded, setImgLoaded] = useState(false);
  const preloadedRef = useRef(false);

  // Preload the primary image as soon as we're within a large buffer zone
  const preloadImage = useCallback((src) => {
    if (preloadedRef.current || !src || src === '/placeholder.svg') return;
    preloadedRef.current = true;
    const img = new Image();
    img.src = src;
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgLoaded(true); // still show even on error
    // If already cached by the browser
    if (img.complete) setImgLoaded(true);
  }, []);

  useEffect(() => {
    // For above-fold cards, preload immediately
    if (index < eagerCount) {
      preloadImage(primaryImage);
      return;
    }

    if (isVisible) {
      preloadImage(primaryImage);
      return;
    }

    const el = cardRef.current;
    if (!el) return;

    // Use a very large rootMargin (1200px) so images start downloading
    // long before the card scrolls into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          preloadImage(primaryImage);
          observer.disconnect();
        }
      },
      { rootMargin: '1200px 0px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, primaryImage, preloadImage, index]);

  const handleImgLoad = useCallback(() => {
    setImgLoaded(true);
  }, []);

  const isAboveFold = index < eagerCount;

  return (
    <div
      ref={cardRef}
      className={`group h-full transition-[opacity,transform] duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${outOfStock ? '[&>div]:opacity-80' : ''}`}
      style={{ willChange: isVisible ? 'auto' : 'opacity, transform' }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={navigateToProduct}
        onKeyDown={handleCardKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`View details for ${product.name}`}
        className="relative cursor-pointer bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 ease-out hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b090] focus-visible:ring-offset-2 flex h-auto min-h-full flex-col justify-between"
      >

        {/* ── Image Section ── */}
        <div className="relative bg-gray-50 p-1.5 sm:p-2">
          <div className="aspect-[3/4] relative overflow-hidden rounded-xl bg-gray-100">
            {/* Shimmer placeholder — visible until image loads */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-[shimmer_1.5s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            )}

            {galleryImages && galleryImages.length > 1 ? (
              <>
                {galleryImages.map((img, idx) => {
                  const isCurrent = idx === currentImageIndex;
                  const isNext = idx === (currentImageIndex + 1) % galleryImages.length;
                  if (!isCurrent && !isNext) return null;
                  return (
                    <img
                      key={`${img}-${idx}`}
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${outOfStock ? 'grayscale' : ''} ${isCurrent ? 'opacity-100' : 'opacity-0'} ${isCurrent && isHovered ? 'scale-105' : 'scale-100'} ${!imgLoaded ? '!opacity-0' : ''}`}
                      loading={isAboveFold ? 'eager' : 'lazy'}
                      fetchpriority={isAboveFold ? 'high' : undefined}
                      decoding={isAboveFold ? 'sync' : 'async'}
                      onLoad={isCurrent ? handleImgLoad : undefined}
                    />
                  );
                })}
              </>
            ) : (
              <img
                src={primaryImage}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-500 ${outOfStock ? 'grayscale' : 'group-hover:scale-[1.05]'} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading={isAboveFold ? 'eager' : 'lazy'}
                fetchpriority={isAboveFold ? 'high' : undefined}
                decoding={isAboveFold ? 'sync' : 'async'}
                onLoad={handleImgLoad}
              />
            )}
          </div>

          {/* Out of stock badge */}
          {outOfStock && (
            <span className="absolute left-4 top-4 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-md">
              Out of Stock
            </span>
          )}

          {/* Discount badge */}
          {pricing.hasDiscount && !outOfStock && (
            <span className="absolute left-4 top-4 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              -{pricing.discountLabel}%
            </span>
          )}
        </div>

        {/* ── Wishlist Heart ── */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md hover:scale-110 z-10"
          aria-label={isWishlisted(productId) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={15}
            className={`transition-colors duration-200 ${
              isWishlisted(productId)
                ? 'fill-[#ff3f6c] text-[#ff3f6c]'
                : 'text-gray-500 hover:text-[#ff3f6c]'
            }`}
          />
        </button>

        {/* ── Product Info ── */}
        <div className="flex flex-col flex-1 px-2 pb-2 pt-1.5 sm:px-2.5 sm:pb-2.5 sm:pt-1.5 text-left w-full">

          <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight line-clamp-2 font-body hover:text-amber-700 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="mt-0.5">
            <StarRating rating={Number(rating)} reviews={Number(reviews)} />
          </div>

          {/* ── Pricing ── */}
          <div className="mt-1 space-y-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-gray-900 font-body">
                ₹{formatPriceINR(pricing.finalPrice)}
              </span>
              {pricing.hasDiscount && (
                <span className="text-xs sm:text-sm text-gray-400 font-body">
                  M.R.P.: <span className="line-through">₹{formatPriceINR(pricing.mrp)}</span>
                </span>
              )}
            </div>

            {pricing.hasDiscount && savingsAmount > 0 && (
              <p className="text-[11px] font-semibold text-emerald-600 font-body text-left w-full">
                You Save: ₹{formatPriceINR(savingsAmount)} ({pricing.discountLabel}%)
              </p>
            )}
          </div>


          {/* Spacer to push CTA to bottom */}
          <div className="flex-1 min-h-1" />

          {/* ── CTA Section ── */}
          <div className="mt-1.5">
            {!cartItem && !outOfStock ? (
              <button
                type="button"
                onClick={handleAddToCartClick}
                disabled={isAddingToCart}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-[12px] font-bold uppercase tracking-widest bg-[#e0b090] text-white shadow-[0_2px_8px_rgba(224,176,144,0.35)] transition-all duration-200 hover:bg-[#d6a382] hover:shadow-[0_4px_16px_rgba(224,176,144,0.45)] hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={13} className="shrink-0" />
                <span className="truncate">{isAddingToCart ? '...' : ctaLabel}</span>
              </button>
            ) : null}

            {!cartItem && outOfStock ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-lg text-xs font-bold tracking-wide bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                >
                  Currently Unavailable
                </button>
                <button
                  type="button"
                  onClick={handleNotifyMeClick}
                  className="w-full py-2 rounded-lg text-xs font-bold tracking-wide border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.97]"
                >
                  Notify Me
                </button>
              </div>
            ) : null}

            {cartItem && !outOfStock ? (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs sm:text-sm font-bold w-6 sm:w-8 text-center font-body">{cartItem.quantity}</span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={reachedStockLimit}
                    className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFromCart}
                    className="ml-auto w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {reachedStockLimit ? (
                  <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 text-center">
                    Max available quantity reached
                  </p>
                ) : null}
              </>
            ) : null}

            {cartItem && outOfStock ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/60 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
                    Currently unavailable
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveFromCart}
                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNotifyMeClick}
                  className="w-full py-2 rounded-lg text-xs font-bold tracking-wide border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.97]"
                >
                  Notify Me
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
