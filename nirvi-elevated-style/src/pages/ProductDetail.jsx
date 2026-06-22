import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Banknote,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Crown,
  Gift,
  Headphones,
  Heart,
  LockKeyhole,
  MapPin,
  Minus,
  Package,
  Paintbrush,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Trash2,
  Truck,
  WalletCards,
  Weight,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCatalog } from '@/context/CatalogContext';
import { useAuth } from '@/context/AuthContext';
import { productsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import ProductCard from '@/components/ProductCard';
import ProductDetailSkeleton from '@/components/ProductDetailSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPriceINR, getProductPricing } from '@/lib/pricing';
import { getEntityStock } from '@/lib/stock';

const ADD_TO_CART_TOAST_DURATION = 1500;

/** Returns a formatted delivery date string, e.g. "Tue, May 21" */
const getFormattedDeliveryDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${dayName}, ${monthName} ${dayOfMonth}`;
};

const clampRatingInput = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 5;
  if (numeric < 1) return 1;
  if (numeric > 5) return 5;
  return Math.round(numeric);
};

const StarRow = ({ rating = 0, size = 16 }) => {
  const normalized = Number(rating || 0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={size}
          className={index <= Math.round(normalized) ? 'fill-foreground text-foreground' : 'text-muted-foreground/40'}
        />
      ))}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, refreshProducts } = useCatalog();

  // State for fetching individual product if not in catalog
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true); // Always start loading until we know
  const [productError, setProductError] = useState('');

  // Try to find product in global catalog first, fallback to fetched product
  let product = products.find((entry) => String(entry.id) === String(id)) || fetchedProduct;

  const { items, addItem, removeItem } = useCart();
  const { startCheckout, savedAddresses } = useCheckout();
  const { isWishlisted, toggle } = useWishlist();
  const { isAuthenticated, user, updateProfile: updateUserProfile, refreshProfile: refreshProfileFn } = useAuth();
  const deliveryPincode = String(
    isAuthenticated ? (user?.pincode || savedAddresses?.[0]?.pincode || '') : ''
  ).trim();
  const hasDeliveryPincode = Boolean(deliveryPincode);

  // Dynamic delivery dates
  const deliveryDateDisplay = getFormattedDeliveryDate(7); // 6-7 days from today
  const deliveryDateRangeStart = getFormattedDeliveryDate(6);
  const deliveryDateRangeEnd = getFormattedDeliveryDate(7);
  const { toast } = useToast();

  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [formError, setFormError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  // Pincode modal state
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeSaving, setPincodeSaving] = useState(false);
  const pincodeInputRef = useRef(null);

  // Fetch individual product if not found in catalog
  useEffect(() => {
    if (!id) {
      return;
    }

    // If product is already found in global catalog, don't fetch again
    const foundInCatalog = products.find((entry) => String(entry.id) === String(id));
    if (foundInCatalog) {
      setFetchedProduct(null);
      setProductLoading(false);
      setProductError('');
      return;
    }

    // If we already have a fetched product, don't fetch again
    if (fetchedProduct && String(fetchedProduct.id) === String(id)) {
      return;
    }

    // Fetch the product by ID
    const fetchProduct = async () => {
      setProductLoading(true);
      setProductError('');
      setFetchedProduct(null);

      try {
        const response = await productsAPI.getById(id);

        // Handle different response formats
        const productData = response?.data || response;

        if (productData && productData.id) {
          // Normalize product data similar to CatalogContext
          const images = Array.isArray(productData.images)
            ? productData.images.filter(Boolean)
            : (productData.image ? [productData.image] : []);

          const normalizedProduct = {
            ...productData,
            id: String(productData.id),
            images,
            image: images[0] || null,
            category: String(productData.category || '').trim().toLowerCase(),
            averageRating: Number(productData.average_rating ?? productData.averageRating ?? 0),
            reviewCount: Number(productData.review_count ?? productData.reviewCount ?? 0),
          };
          setFetchedProduct(normalizedProduct);
          setProductError('');
        } else {
          setProductError('Product not found');
          setFetchedProduct(null);
        }
      } catch (error) {
        console.error('[ProductDetail] Error fetching product:', error);
        setProductError(error?.status === 404 ? 'Product not found' : (error?.message || 'Failed to load product'));
        setFetchedProduct(null);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProduct();
  }, [id, products]);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shift the floating WhatsApp button up when the sticky bar is visible
  useEffect(() => {
    const root = document.documentElement;
    if (showStickyBar) {
      root.style.setProperty('--wa-offset', '84'); // px offset for sticky bar height
    } else {
      root.style.removeProperty('--wa-offset');
    }
    return () => root.style.removeProperty('--wa-offset');
  }, [showStickyBar]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = Array.isArray(product?.images) && product?.images.length > 0
      ? product?.images
      : (product?.image ? [product?.image] : []);
    return images.filter(Boolean);
  }, [product]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages]);

  // Track Recently Viewed
  useEffect(() => {
    if (product && product.id) {
      try {
        const viewed = JSON.parse(localStorage.getItem('vris_recently_viewed') || '[]');
        const existingIndex = viewed.findIndex(p => String(p.id) === String(product.id));
        if (existingIndex > -1) viewed.splice(existingIndex, 1);
        viewed.unshift({
          id: product.id,
          name: product.name,
          image: product.image || (product.images && product.images[0]) || '',
          price: product.price
        });
        localStorage.setItem('vris_recently_viewed', JSON.stringify(viewed.slice(0, 10)));
      } catch (err) { }
    }
  }, [product]);

  const fetchReviews = useCallback(async () => {
    if (!id) {
      return;
    }

    setReviewsLoading(true);
    setReviewsError('');

    try {
      const response = await productsAPI.getReviews(id);
      const payload = response.data || {};

      setReviews(payload.reviews || []);
      setAverageRating(Number(payload.averageRating || 0));
      setReviewCount(Number(payload.reviewCount || 0));
    } catch (error) {
      setReviewsError(error.data?.message || error.message || 'Unable to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const primaryImage = activeImage || galleryImages[0] || '/placeholder.svg';
  const cartItem = product ? items.find((entry) => entry.id === product?.id) : null;
  const related = product
    ? products.filter((entry) => entry?.category === product?.category && entry?.id !== product?.id).slice(0, 4)
    : [];

  const pricing = getProductPricing(product || {});
  const finalPrice = pricing?.finalPrice || 0;
  const stockValue = getEntityStock(product || {}, 0);
  const isInStock = stockValue > 0;
  const remainingStock = Math.max(stockValue - Number(cartItem?.quantity || 0), 0);
  const ratingValue = Number(averageRating || product?.averageRating || 0);
  const ratingTotal = Number(reviewCount || product?.reviewCount || 0);
  const cartQuantity = Number(cartItem?.quantity || 0);
  const sidebarPincode = hasDeliveryPincode ? deliveryPincode : '250002';
  const isPlusMember = Boolean(
    user?.is_plus_member ||
    user?.isPlusMember ||
    user?.plusMember ||
    user?.vrisPlusMember ||
    user?.membership === 'plus' ||
    user?.membership_status === 'active'
  );

  const customBannerItems = useMemo(() => {
    const targets = ['Cute Bear Denim Pouch', 'Cosmic Creation Tote Bag', 'Serpent Denim Cap', 'VRIS Formula X Racing Pouch'];
    const normalizeName = (value) => String(value || '').trim().toLowerCase();
    const fallbackItems = [product, ...related, ...products].filter(Boolean);

    return targets.map((target, index) => {
      const normalizedTarget = normalizeName(target);
      const matchedProduct = products.find((entry) => normalizeName(entry?.name) === normalizedTarget)
        || products.find((entry) => normalizeName(entry?.name).includes(normalizedTarget));
      const fallback = fallbackItems[index] || product || {};
      const image = matchedProduct?.image
        || matchedProduct?.images?.[0]
        || fallback?.image
        || fallback?.images?.[0]
        || galleryImages[index]
        || primaryImage;

      return { name: target, image };
    });
  }, [galleryImages, primaryImage, product, products, related]);

  useEffect(() => {
    if (!isInStock) {
      if (qty !== 1) {
        setQty(1);
      }
      return;
    }

    if (remainingStock > 0 && qty > remainingStock) {
      setQty(remainingStock);
    }
  }, [isInStock, qty, remainingStock]);

  const addSelectedQuantityToCart = () => {
    const quantityToAdd = Math.max(0, Math.min(qty, remainingStock));
    if (quantityToAdd > 0) {
      addItem({
        id: product?.id,
        name: product?.name || 'Product',
        price: finalPrice,
        image: primaryImage,
        category: product?.category || 'General',
        stock: stockValue,
        quantity: quantityToAdd,
      });
    }
  };

  const handleAddToCart = () => {
    if (!isInStock || remainingStock <= 0) {
      return;
    }
    addSelectedQuantityToCart();
    toast({
      title: 'Added to cart',
      description: `${product?.name || 'Product'} has been added to your shopping bag.`,
      duration: ADD_TO_CART_TOAST_DURATION,
    });
  };

  const handleBuyNow = () => {
    if (!isInStock || remainingStock <= 0) {
      return;
    }

    const quantityToBuyNow = Math.max(1, Math.min(qty, remainingStock));

    startCheckout({
      source: 'buyNow',
      item: {
        id: product?.id,
        name: product?.name || 'Product',
        price: finalPrice,
        image: primaryImage,
        category: product?.category || 'General',
        quantity: quantityToBuyNow,
        stock: stockValue,
      },
    });
    navigate('/checkout');
  };

  const handleNotifyMe = () => {
    toast({
      title: 'Notify Me is coming soon',
      description: `${product?.name || 'Product'} is currently unavailable. Restock alerts will be available soon.`,
    });
  };

  const handlePincodeActionClick = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Please login first',
        description: 'Login to add your pincode and address details.',
      });
      navigate('/login', { state: { redirectTo: `/product/${id}` } });
      return;
    }
    // Authenticated: open pincode modal
    setPincodeInput(deliveryPincode || '');
    setShowPincodeModal(true);
    setTimeout(() => pincodeInputRef.current?.focus(), 100);
  }, [isAuthenticated, toast, navigate, id, deliveryPincode]);

  const handleSavePincode = useCallback(async () => {
    const trimmed = pincodeInput.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      toast({
        variant: 'destructive',
        title: 'Invalid pincode',
        description: 'Please enter a valid 6-digit pincode.',
      });
      return;
    }
    setPincodeSaving(true);
    try {
      await updateUserProfile({
        name: user?.name || '',
        phone: user?.phone || '',
        pincode: trimmed,
        addressLine1: user?.address_line1 || '',
        addressLine2: user?.address_line2 || '',
        city: user?.city || '',
        state: user?.state || '',
        dob: user?.dob || null,
        gender: user?.gender || null,
        defaultAddressEnabled: user?.default_address_enabled ?? true,
      });
      toast({
        title: 'Pincode saved',
        description: `Delivery pincode set to ${trimmed}.`,
      });
      setShowPincodeModal(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to save pincode',
        description: err?.message || 'Please try again.',
      });
    } finally {
      setPincodeSaving(false);
    }
  }, [pincodeInput, toast, user, updateUserProfile]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Please login first',
        description: 'You need an account to submit a review.',
      });
      return;
    }

    if (reviewForm.rating === 0) {
      setFormError('Please select a star rating before submitting your review.');
      return;
    }

    const rating = clampRatingInput(reviewForm.rating);
    const comment = String(reviewForm.comment || '').trim();

    if (comment.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Review is too short',
        description: 'Please write at least 3 characters.',
      });
      return;
    }

    setIsSubmittingReview(true);
    setReviewsError('');

    try {
      if (editingReviewId) {
        await productsAPI.updateReview(product?.id, editingReviewId, rating, comment);
        setEditingReviewId(null);
        toast({ title: 'Review updated', description: 'Your review was updated successfully.' });
      } else {
        await productsAPI.addReview(product?.id, rating, comment);
        toast({ title: 'Review submitted', description: 'Thanks for sharing your feedback.' });
      }
      setReviewForm({ rating: 0, comment: '' });
      setFormError('');
      await fetchReviews();
      await refreshProducts();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: editingReviewId ? 'Could not update review' : 'Could not submit review',
        description: error.data?.message || error.message || 'Please try again.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReviewId) return;
    try {
      await productsAPI.deleteReview(product?.id, deletingReviewId);
      await fetchReviews();
      await refreshProducts();
      if (editingReviewId === deletingReviewId) {
        setEditingReviewId(null);
        setReviewForm({ rating: 0, comment: '' });
        setFormError('');
      }
      setDeletingReviewId(null);
      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not delete review',
        description: error.data?.message || error.message || 'Please try again.',
      });
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setReviewForm({ rating: review.rating, comment: review.comment });
    const formElement = document.getElementById('review-form');
    if (formElement) {
      window.scrollTo({ top: formElement.offsetTop - 100, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setReviewForm({ rating: 0, comment: '' });
    setFormError('');
  };

  const ratingCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const star = Math.round(Number(r.rating));
      if (counts[star] !== undefined) {
        counts[star]++;
      }
    });
    return counts;
  }, [reviews]);

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <ProductDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-[96px] md:pt-[104px] w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground font-body mb-6">{productError || 'The product you are looking for does not exist or may have been removed.'}</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity font-body">
            <ChevronLeft size={18} /> Back to Shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-[96px] md:pt-[104px]">
        <nav className="flex items-center gap-1.5 overflow-x-auto py-4 text-[13px] font-medium text-muted-foreground no-scrollbar">
          <Link to="/" className="whitespace-nowrap transition-colors hover:text-foreground">Home</Link>
          <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
          {product?.category ? (
            <>
              <Link to={`/shop?category=${product.category}`} className="whitespace-nowrap capitalize transition-colors hover:text-foreground">{String(product.category).replace(/-/g, ' ')}</Link>
              <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
            </>
          ) : null}
          <span className="min-w-0 truncate text-foreground">{product?.name || 'Product'}</span>
        </nav>

        <div className="grid gap-4 py-2 lg:gap-5 xl:gap-[20px] lg:grid-cols-[minmax(0,0.9fr)_minmax(390px,1fr)] xl:grid-cols-[42fr_36fr_22fr]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="min-w-0 xl:col-span-1">
            <div className="flex flex-col gap-3 rounded-[16px] border border-black/8 bg-white p-3 lg:p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-background/40">
                {pricing?.hasDiscount ? (
                  <div className="absolute left-3.5 top-3.5 z-10 rounded-full bg-[#e0b090] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(224,176,144,0.25)]">
                    -{pricing?.discountLabel || 0}% Off
                  </div>
                ) : null}
                <img
                  src={primaryImage}
                  alt={product?.name || 'Product'}
                  className="h-full w-full object-contain p-2 sm:p-4 transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute bottom-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-black/8 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur sm:hidden">
                  {(galleryImages.length ? galleryImages : [primaryImage]).map((image, index) => (
                    <button
                      key={`${image}-dot-${index}`}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      aria-label={`Go to product image ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${activeImage === image ? 'w-5 bg-[#e0b090]' : 'w-1.5 bg-black/20 hover:bg-black/40'}`}
                    />
                  ))}
                </div>
              </div>

              {galleryImages.length > 1 ? (
                <div className="mt-1 flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      aria-label={`View product image ${index + 1}`}
                      className={`h-[80px] w-[64px] shrink-0 overflow-hidden rounded-md border bg-white p-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${activeImage === image ? 'border-[#e0b090] shadow-[0_4px_12px_rgba(224,176,144,0.15)]' : 'border-black/8 hover:border-[#e0b090]/60'
                        }`}
                    >
                      <img src={image} alt={`${product?.name || 'Product'} ${index + 1}`} className="h-full w-full rounded-[4px] object-cover" loading={index < 5 ? 'eager' : 'lazy'} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Product Feature Badges */}
            {product?.features && Array.isArray(product.features) && product.features.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-5 sm:gap-6">
                {product.features.map((feature, index) => (
                  <div key={`feature-${index}`} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f5] text-muted-foreground">
                      {index === 0 ? <Paintbrush size={15} /> : index === 1 ? <ShieldCheck size={15} /> : index === 2 ? <ShoppingBag size={15} /> : <Weight size={15} />}
                    </span>
                    <span className="max-w-[80px] text-[10px] font-semibold leading-tight text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start xl:col-span-1"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex h-7 items-center rounded-md border border-[#e0b090]/35 bg-[#fbf5f1] px-2.5 text-[10px] font-extrabold uppercase tracking-wide text-[#e0b090]">
                Best Seller
              </span>
              <button
                type="button"
                onClick={() => toggle(product?.id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#e0b090]/50 hover:shadow-md"
                aria-label={isWishlisted(product?.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} className={isWishlisted(product?.id) ? 'fill-[#ff3f6c] text-[#ff3f6c]' : ''} />
              </button>
            </div>

            <h1 className="mt-3 font-display text-[clamp(28px,2.4vw,36px)] font-bold leading-tight text-foreground">{product?.name || 'Product'}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex h-10 max-h-[42px] items-center gap-1 rounded-full border border-black/10 bg-[#f7fffc] px-3 shadow-sm">
                <span className="text-sm font-extrabold">{ratingValue.toFixed(1)}</span>
                <Star size={14} className="fill-[#03a685] text-[#03a685]" />
                <span className="ml-1 border-l border-black/10 pl-2 text-xs font-semibold text-muted-foreground">{ratingTotal} Ratings</span>
              </div>
            </div>

            <p className="mt-3 max-h-[78px] overflow-hidden text-[15px] leading-6 text-muted-foreground">
              {product?.description || product?.category || 'Designed for everyday personality, easy styling, and VRIS signature charm.'}
            </p>

            <div className="mt-4">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-[clamp(30px,2.5vw,36px)] font-extrabold leading-none tracking-tight text-foreground">₹{formatPriceINR(finalPrice)}</span>
                {pricing?.hasDiscount ? (
                  <>
                    <span className="pb-1 text-base font-semibold text-muted-foreground line-through">₹{formatPriceINR(pricing?.mrp || 0)}</span>
                    <span className="mb-1 inline-flex h-7 items-center rounded-full bg-[#fbf5f1] px-3 text-xs font-extrabold uppercase tracking-wide text-[#e0b090]">
                      {pricing?.discountLabel || 0}% Off
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
                <span className="text-[#03a685]">Inclusive of all taxes</span>
                <span className={`rounded-full px-2.5 py-1 ${isInStock ? 'bg-[#eafaf5] text-[#038767]' : 'bg-destructive/10 text-destructive'}`}>
                  {isInStock ? `In stock (${stockValue} available)` : 'Currently unavailable'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="text-sm font-extrabold text-foreground">Quantity</span>
              <div className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-1 shadow-sm">
                <button
                  type="button"
                  disabled={!isInStock}
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  className="flex h-7 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="flex w-9 items-center justify-center text-sm font-extrabold tabular-nums">{qty}</span>
                <button
                  type="button"
                  disabled={!isInStock || remainingStock <= 0 || qty >= remainingStock}
                  onClick={() => setQty((current) => current + 1)}
                  className="flex h-7 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <button
                type="button"
                disabled={(!isInStock || remainingStock <= 0) && !cartItem}
                onClick={() => {
                  if (cartItem) {
                    removeItem(product?.id);
                    toast({
                      title: 'Removed from cart',
                      description: `${product?.name || 'Product'} has been removed.`,
                      duration: ADD_TO_CART_TOAST_DURATION,
                    });
                  } else {
                    handleAddToCart();
                  }
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#02a77d] to-[#06c78e] px-5 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {cartItem ? <Check size={18} /> : <ShoppingBag size={18} />}
                {cartItem ? 'Added' : 'Add to Cart'}
              </button>
              <button
                type="button"
                disabled={!isInStock || remainingStock <= 0}
                onClick={handleBuyNow}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#e0b090] bg-white px-5 text-sm font-extrabold uppercase tracking-wide text-[#e0b090] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#fbf5f1] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={() => toggle(product?.id)}
                className="hidden h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-white text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#e0b090]/50 sm:flex"
                aria-label={isWishlisted(product?.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={19} className={isWishlisted(product?.id) ? 'fill-[#ff3f6c] text-[#ff3f6c]' : ''} />
              </button>
            </div>

            {!isInStock || remainingStock <= 0 ? (
              <button
                type="button"
                onClick={handleNotifyMe}
                className="mt-3 w-full rounded-xl border border-black/10 bg-white py-3 text-xs font-extrabold uppercase tracking-widest text-foreground shadow-sm transition-all hover:bg-muted"
              >
                Notify Me
              </button>
            ) : null}

            {cartItem ? (
              <p className="mt-3 text-xs font-medium text-muted-foreground">{cartItem.quantity} already in cart</p>
            ) : null}
            {isInStock && remainingStock <= 0 && cartItem ? (
              <p className="mt-1 text-xs font-semibold text-destructive">All available units are already in your cart.</p>
            ) : null}

            <div className="mt-8 border-t border-black/5 pt-6">
              <div className="flex">
                <div className="flex flex-1 flex-col gap-4 border-r border-black/5 pr-3 sm:pr-4">
                  <div className="flex gap-3">
                    <Package size={18} className="mt-0.5 shrink-0 text-[#e0b090]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] font-bold text-foreground">Ships from</span>
                      <span className="mt-0.5 text-xs font-medium text-muted-foreground">VRIS</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Store size={18} className="mt-0.5 shrink-0 text-[#e0b090]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] font-bold text-foreground">Sold by</span>
                      <span className="mt-0.5 text-xs font-medium leading-[1.1rem] text-muted-foreground">VRISBYVRITI<br />Pvt Ltd</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Gift size={18} className="mt-0.5 shrink-0 text-[#e0b090]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] font-bold text-foreground">Gift Options</span>
                      <span className="mt-0.5 text-xs font-medium text-muted-foreground">Available at checkout</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 pl-4 sm:pl-5">
                  <div className="flex gap-3">
                    <Package size={18} className="mt-0.5 shrink-0 text-[#e0b090]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] font-bold text-foreground">Packaging</span>
                      <span className="mt-0.5 text-xs font-medium leading-[1.1rem] text-muted-foreground">Ships in secure product packaging</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CreditCard size={18} className="mt-0.5 shrink-0 text-[#e0b090]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] font-bold text-foreground">Payment</span>
                      <span className="mt-0.5 text-xs font-medium text-muted-foreground">Secure transaction</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#e0b090]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] font-bold text-foreground">Warranty</span>
                      <span className="mt-0.5 text-xs font-medium text-muted-foreground">1 Year Warranty</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3 lg:col-span-2 xl:col-span-1 xl:self-start"
          >
            <div className="relative h-auto overflow-hidden rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <Truck size={36} className="absolute right-3 top-3 text-[#03a685]/10" />
              <h2 className="text-[13px] font-extrabold text-foreground">Delivery & Services</h2>
              <div className="mt-3 space-y-2 text-xs leading-tight text-foreground">
                <div className="flex items-start gap-2">
                  <Truck size={14} className="mt-0.5 shrink-0 text-foreground" />
                  <div className="min-w-0 flex-1">
                    <p>Get it by <span className="font-extrabold">{deliveryDateDisplay}</span></p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white px-2 py-1.5 shadow-sm">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground">
                    <MapPin size={13} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{sidebarPincode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePincodeActionClick}
                    className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-[#e0b090] hover:underline"
                  >
                    Change
                  </button>
                </div>
                <div className="flex items-center gap-2"><Banknote size={14} className="shrink-0" /><span>Pay on delivery available</span></div>
                <div className="flex items-center gap-2"><RefreshCcw size={14} className="shrink-0" /><span>Easy 7 days return & exchange</span></div>
                <div className="flex items-center gap-2"><BadgeCheck size={14} className="shrink-0" /><span>100% Original Products</span></div>
              </div>
            </div>

            <div className="h-auto rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[13px] font-extrabold text-foreground">Best Offers for You</h2>
                <Tag size={13} />
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] leading-tight text-foreground">
                <li className="flex gap-1.5">
                  <BadgePercent size={13} className="mt-0.5 shrink-0 text-[#e0b090]" />
                  <span><span className="font-extrabold text-[#e0b090]">Coupon:</span> Extra 10% off above ₹499 (Code: VRIS10)</span>
                </li>
                <li className="flex gap-1.5">
                  <CreditCard size={13} className="mt-0.5 shrink-0 text-[#e0b090]" />
                  <span><span className="font-extrabold text-[#e0b090]">Bank:</span> 5% Cashback on Axis Bank Credit Card</span>
                </li>
                <li className="flex gap-1.5">
                  <WalletCards size={13} className="mt-0.5 shrink-0 text-[#e0b090]" />
                  <span><span className="font-extrabold text-[#e0b090]">Wallet:</span> Flat ₹150 Cashback on Paytm</span>
                </li>
              </ul>
              <button type="button" className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#e0b090] hover:underline">
                View all offers <ArrowRight size={10} />
              </button>
            </div>

            <div className="relative max-h-[220px] overflow-hidden rounded-xl border border-[#ffbad0] bg-[#ffeaf1] p-4 shadow-sm">
              <div className="absolute right-3 top-3 rounded-full bg-white/60 p-2 text-[#e0b090]">
                <Crown size={20} />
              </div>
              <div className="relative max-w-[80%]">
                <div className="flex items-center gap-1.5">
                  <Crown size={13} className="fill-[#e0b090] text-[#e0b090]" />
                  <h2 className="font-display text-[13px] font-bold text-foreground">VRIS Plus</h2>
                </div>
                <p className="mt-1.5 text-[11px] font-medium leading-tight text-foreground">
                  {isPlusMember ? 'FREE Delivery + Perks active.' : 'Get FREE Delivery + Discounts!'}
                </p>
                <p className="mt-1 text-[10px] font-bold text-[#e0b090]">
                  {isPlusMember ? 'Thanks for being a member.' : 'Join for ₹99/month'}
                </p>
              </div>
              <Link to="/vris-plus" className="relative mt-2.5 inline-flex h-[36px] items-center rounded-lg bg-[#e0b090] px-4 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#d6a382]">
                {isPlusMember ? 'Manage' : 'Join Now'}
              </Link>
            </div>
          </motion.aside>
        </div>

        <div className="hidden" aria-hidden="true">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <img src={primaryImage} alt={product?.name || 'Product'} className="w-full aspect-square object-cover" loading="eager" fetchpriority="high" />
            </div>

            {galleryImages.length > 1 ? (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`overflow-hidden rounded-2xl border transition-colors ${activeImage === image ? 'border-foreground' : 'border-border hover:border-foreground/60'}`}
                  >
                    <img src={image} alt={`${product?.name || 'Product'} ${index + 1}`} className="aspect-square w-full object-cover" loading={index < 5 ? "eager" : "lazy"} />
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{product?.name || 'Product'}</h1>
            <p className="text-lg text-muted-foreground mt-1 font-body">{product?.description || product?.category || 'Product'}</p>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1 border border-border px-2 py-0.5 rounded-sm bg-muted/20">
                <span className="font-bold text-sm">{Number(averageRating || product?.averageRating || 0).toFixed(1)}</span>
                <Star size={12} className="fill-[#03a685] text-[#03a685]" />
                <span className="text-muted-foreground text-xs ml-1 border-l border-border pl-2">{reviewCount || product?.reviewCount || 0} Ratings</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground font-body">₹{formatPriceINR(pricing?.finalPrice || 0)}</span>
                {pricing?.hasDiscount ? (
                  <>
                    <span className="text-lg text-muted-foreground line-through font-body">MRP ₹{formatPriceINR(pricing?.mrp || 0)}</span>
                    <span className="text-lg font-bold text-[#e0b090] font-body">({pricing?.discountLabel || 0}% OFF)</span>
                  </>
                ) : null}
              </div>
              <p className="text-xs text-[#03a685] font-bold mt-1 tracking-wide font-body">inclusive of all taxes</p>
              <p className={`mt-2 text-sm font-medium font-body ${isInStock ? 'text-foreground' : 'text-destructive'}`}>
                {isInStock ? `In stock (${stockValue} available)` : 'Currently unavailable'}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-bold text-foreground font-body">Quantity:</span>
              <div className="flex items-center rounded-sm border border-border h-8">
                <button
                  type="button"
                  disabled={!isInStock}
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  className="w-8 flex items-center justify-center hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 flex items-center justify-center text-sm font-bold font-body">{qty}</span>
                <button
                  type="button"
                  disabled={!isInStock || remainingStock <= 0 || qty >= remainingStock}
                  onClick={() => setQty((current) => current + 1)}
                  className="w-8 flex items-center justify-center hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={(!isInStock || remainingStock <= 0) && !cartItem}
                onClick={() => {
                  if (cartItem) {
                    removeItem(product?.id);
                    toast({
                      title: 'Removed from cart',
                      description: `${product?.name || 'Product'} has been removed.`,
                      duration: ADD_TO_CART_TOAST_DURATION,
                    });
                  } else {
                    handleAddToCart();
                  }
                }}
                className={`flex-1 py-3.5 rounded-md text-white text-sm font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${cartItem ? 'bg-[#03a685] hover:bg-[#028b6f]' : 'bg-[#e0b090] hover:bg-[#d6a382]'
                  }`}
              >
                <ShoppingBag size={18} /> {cartItem ? 'Added' : 'Add to Cart'}
              </button>
              <button
                type="button"
                disabled={!isInStock || remainingStock <= 0}
                onClick={handleBuyNow}
                className="flex-1 py-3.5 rounded-md border border-border bg-background text-foreground text-sm font-bold tracking-wide uppercase hover:border-foreground transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={() => toggle(product?.id)}
                className="p-3.5 rounded-md border border-border bg-background text-foreground hover:border-foreground transition-colors flex items-center justify-center shadow-sm"
              >
                <Heart size={18} className={isWishlisted(product?.id) ? 'fill-[#ff3f6c] text-[#ff3f6c]' : ''} />
              </button>
            </div>
            {!isInStock || remainingStock <= 0 ? (
              <button
                type="button"
                onClick={handleNotifyMe}
                className="mt-3 w-full rounded-md border border-border py-3 text-xs font-bold tracking-widest uppercase text-foreground transition-colors hover:bg-muted"
              >
                Notify Me
              </button>
            ) : null}

            {cartItem ? (
              <p className="text-xs text-muted-foreground mt-3 font-body">{cartItem.quantity} already in cart</p>
            ) : null}
            {isInStock && remainingStock <= 0 && cartItem ? (
              <p className="text-xs text-destructive mt-1 font-body">All available units are already in your cart.</p>
            ) : null}

            <div className="mt-6 pt-4 border-t border-border/50 text-sm text-muted-foreground font-body space-y-1">
              <div className="flex items-center gap-2">
                Get it by <span className="font-bold text-foreground">{deliveryDateDisplay}</span> -
                <button
                  type="button"
                  onClick={handlePincodeActionClick}
                  className="font-medium text-foreground hover:underline hover:text-[#e0b090] cursor-pointer bg-transparent border-none p-0"
                >
                  {hasDeliveryPincode ? deliveryPincode : 'ADD Pincode'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                Seller: <span className="font-bold text-[#e0b090]">VRIS</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-bold font-display text-sm tracking-wide uppercase">
                Delivery Options <Truck size={18} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 max-w-xs">
                <div className="flex items-center gap-2 text-sm text-foreground font-body">
                  <MapPin size={16} className="text-muted-foreground" />
                  {hasDeliveryPincode ? deliveryPincode : 'ADD Pincode'}
                </div>
                <button
                  type="button"
                  onClick={handlePincodeActionClick}
                  className="text-xs font-bold text-[#e0b090] uppercase tracking-wide hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  {hasDeliveryPincode ? 'Change' : 'ADD'}
                </button>
              </div>
              <div className="space-y-3 mt-4 text-sm text-foreground font-body">
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-muted-foreground" />
                  <span>Get it by {deliveryDateDisplay}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Banknote size={18} className="text-muted-foreground" />
                  <span>Pay on delivery available</span>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshCcw size={18} className="text-muted-foreground" />
                  <span>Easy 7 days return & exchange available</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-muted-foreground" />
                  <span>100% Original Products</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-foreground font-bold font-display text-sm tracking-wide uppercase mb-4">
                Best Offers <Tag size={18} />
              </div>
              <ul className="space-y-2 text-sm font-body text-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e0b090] shrink-0 mt-1.5"></span>
                  <span><span className="font-bold text-[#e0b090]">Coupon:</span> Extra 10% off on orders above ₹499 (Code: VRIS10)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e0b090] shrink-0 mt-1.5"></span>
                  <span><span className="font-bold text-[#e0b090]">Bank Offer:</span> 5% Unlimited Cashback on Axis Bank Credit Card</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e0b090] shrink-0 mt-1.5"></span>
                  <span><span className="font-bold text-[#e0b090]">Cashback:</span> Flat ₹150 Cashback on Paytm Wallet</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <Link to="/custom-product-request" className="mt-6 block w-[calc(100%+48px)] -ml-6 sm:w-full sm:ml-0 overflow-hidden shadow-sm">
          <img src="https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/custom1.png" alt="Custom Creations, Just for You" className="w-full h-auto object-cover" />
        </Link>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: ShieldCheck, title: 'Secure Payments', text: 'Encrypted checkout' },
            { icon: RefreshCcw, title: '7 Days Easy Returns', text: 'Simple exchanges' },
            { icon: BadgeCheck, title: '100% Authentic Products', text: 'VRIS verified' },
            { icon: Headphones, title: 'Dedicated Support', text: 'Customer care' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex h-[80px] max-h-[80px] items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbf5f1] text-[#e0b090]">
                <Icon size={16} />
              </span>
              <span>
                <span className="block text-[13px] font-extrabold text-foreground">{title}</span>
                <span className="block text-[11px] font-medium text-muted-foreground">{text}</span>
              </span>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-7">
          <div className="grid gap-12 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">Ratings <span className="text-muted-foreground font-normal ml-1">★</span></h2>
              </div>

              <div className="flex items-center gap-8 mb-6">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="text-4xl font-bold font-body text-foreground flex items-center gap-1">
                    {Number(averageRating || product?.averageRating || 0).toFixed(1)} <Star size={24} className="fill-[#03a685] text-[#03a685]" />
                  </div>
                  <div className="text-sm text-muted-foreground font-body">{reviewCount || product?.reviewCount || 0} Verified Buyers</div>
                </div>

                <div className="w-[1px] h-16 bg-border/50"></div>

                <div className="flex-1 space-y-1.5 max-w-xs">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingCounts[star] || 0;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <div className="flex items-center gap-1 w-8 justify-end">{star} <Star size={10} className="fill-muted-foreground" /></div>
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-[#03a685] rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="w-8 text-right">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-4 border-t border-border/50 pt-6">Customer Reviews</h3>

              {reviewsError ? (
                <p className="text-sm text-destructive font-body">{reviewsError}</p>
              ) : null}

              {reviewsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-md bg-muted/50" />
                  ))}
                </div>
              ) : null}

              {!reviewsLoading && reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">No reviews yet. Be the first to review this product.</p>
              ) : null}

              {!reviewsLoading && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <article key={review.id} className="border-b border-border/50 pb-6 last:border-0 relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 bg-[#03a685] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {review.rating} <Star size={10} className="fill-current" />
                        </div>
                        {user && String(user.id) === String(review.userId) && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleEditReview(review)} className="text-xs text-[#03a685] font-semibold hover:underline">Edit</button>
                            <button onClick={() => setDeletingReviewId(review.id)} className="text-xs text-[#e0b090] font-semibold hover:underline">Delete</button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-body text-foreground">{review.comment}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mt-3">
                        <span className="font-medium text-foreground">{review.userName}</span>
                        <span>|</span>
                        <span>
                          {review.updatedAt || review.createdAt
                            ? new Date(review.updatedAt || review.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                            : 'Unknown date'}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6" id="review-form">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              {!isAuthenticated ? (
                <p className="text-sm text-muted-foreground font-body">
                  <Link to="/login" className="font-semibold text-[#e0b090] underline">Login</Link> to submit your rating and review.
                </p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-foreground">Rating</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)} role="radiogroup" aria-label="Product rating">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isSelected = reviewForm.rating > 0;
                          const displayRating = isSelected ? reviewForm.rating : hoverRating;
                          const isActive = starValue <= displayRating;
                          const isLocked = isSelected && isActive;
                          return (
                            <button
                              key={starValue}
                              type="button"
                              onClick={() => setReviewForm((current) => ({ ...current, rating: clampRatingInput(starValue) }))}
                              onMouseEnter={() => !isSelected && setHoverRating(starValue)}
                              onFocus={() => !isSelected && setHoverRating(starValue)}
                              onBlur={() => setHoverRating(0)}
                              aria-checked={reviewForm.rating === starValue}
                              role="radio"
                              className={`p-1 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b090] rounded-full transform ${isSelected ? 'hover:scale-100 cursor-pointer' : 'hover:scale-110 active:scale-95'} ${isActive ? `text-[#fbbf24] ${isLocked ? 'opacity-60' : ''}` : 'text-muted-foreground/30'}`}
                              aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
                            >
                              <Star
                                size={32}
                                className={`transition-all duration-300 ${isActive ? `fill-current ${isLocked ? '' : 'drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'}` : ''}`}
                                strokeWidth={isActive ? 0 : 1.5}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-sm font-semibold transition-colors duration-300 w-24 tabular-nums">
                        {reviewForm.rating > 0 ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating - 1] : (hoverRating > 0 ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating - 1] : '')}
                      </span>
                    </div>
                  </div>
                  {formError && (
                    <div className="text-sm text-destructive font-semibold bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                      {formError}
                    </div>
                  )}

                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-foreground">Comment</span>
                    <textarea
                      rows={5}
                      value={reviewForm.comment}
                      onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                      placeholder="Share your product experience"
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground shadow-sm"
                    />
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className={`flex-1 rounded-md px-4 py-3 text-sm font-bold tracking-wide uppercase text-white transition-colors disabled:opacity-60 shadow-sm ${editingReviewId ? 'bg-[#111827] hover:bg-[#1f2937]' : 'bg-[#e0b090] hover:bg-[#d6a382]'}`}
                    >
                      {isSubmittingReview ? (editingReviewId ? 'Updating...' : 'Submitting...') : (editingReviewId ? 'Update Review' : 'Submit Review')}
                    </button>
                    {editingReviewId && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md border border-border px-6 py-3 text-sm font-bold tracking-wide uppercase text-foreground transition-colors hover:bg-muted shadow-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="py-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.map((entry, index) => <ProductCard key={entry.id} product={entry} index={index} />)}
            </div>
          </section>
        ) : null}
      </div>

      <AnimatePresence>
        {deletingReviewId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDeletingReviewId(null)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed top-1/2 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-[380px] rounded-3xl bg-background p-0 shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-border/60 overflow-hidden"
            >
              {/* Gradient accent top strip */}
              <div className="h-1 w-full bg-gradient-to-r from-[#e0b090] via-[#ff6b8a] to-[#e0b090]" />
              <div className="p-7 text-center">
                <motion.div
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 mb-5 shadow-sm"
                >
                  <Trash2 size={28} className="text-destructive" strokeWidth={1.8} />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Delete Review?</h3>
                <p className="text-sm text-muted-foreground font-body mb-7 leading-relaxed max-w-[280px] mx-auto">This review will be permanently removed. This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletingReviewId(null)}
                    className="flex-1 rounded-xl border border-border/80 py-3 text-sm font-bold uppercase tracking-wide text-foreground transition-all duration-200 hover:bg-muted hover:border-border active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#e0b090] to-[#d6a382] py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-200 hover:shadow-[0_4px_16px_rgba(224,176,144,0.35)] active:scale-[0.97]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Pincode Modal ── */}
      <AnimatePresence>
        {showPincodeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowPincodeModal(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed top-1/2 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-[400px] rounded-3xl bg-background p-0 shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-border/60 overflow-hidden"
            >
              {/* Gradient accent top strip */}
              <div className="h-1 w-full bg-gradient-to-r from-[#e0b090] via-[#ff6b8a] to-[#e0b090]" />
              <div className="p-7">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0b090]/10 to-[#e0b090]/20 dark:from-[#e0b090]/30 dark:to-[#e0b090]/20 shadow-sm">
                      <MapPin size={18} className="text-[#e0b090]" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">Delivery Pincode</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPincodeModal(false)}
                    className="p-1.5 rounded-xl hover:bg-muted transition-all duration-200 active:scale-90"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground font-body mb-5 ml-[52px]">Check delivery availability for your area.</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 flex items-center rounded-xl border border-border/80 bg-muted/30 px-4 py-3 focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#e0b090]/10 transition-all duration-200">
                    <input
                      ref={pincodeInputRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit pincode"
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSavePincode(); }}
                      className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50 font-body tracking-wider font-semibold"
                    />
                    {pincodeInput.length > 0 && pincodeInput.length < 6 && (
                      <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">{pincodeInput.length}/6</span>
                    )}
                    {pincodeInput.length === 6 && (
                      <CheckCircle size={16} className="text-[#03a685] shrink-0" />
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={pincodeSaving || pincodeInput.trim().length !== 6}
                    onClick={handleSavePincode}
                    className="shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-[#e0b090] to-[#d6a382] text-white text-sm font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-[0_4px_16px_rgba(224,176,144,0.35)] active:scale-[0.97]"
                  >
                    {pincodeSaving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Saving
                      </span>
                    ) : 'Save'}
                  </button>
                </div>
                {hasDeliveryPincode && (
                  <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-[#03a685]/8 border border-[#03a685]/15">
                    <CheckCircle size={14} className="text-[#03a685] shrink-0" />
                    <p className="text-xs text-foreground font-body">Current pincode: <span className="font-bold">{deliveryPincode}</span></p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sticky Bottom Bar ── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[40] h-[76px] border-t border-black/10 bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
          >
            <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
              <div className="flex min-w-0 items-center gap-3">
                <img src={primaryImage} alt="" className="hidden h-11 w-11 rounded-xl border border-black/10 object-cover shadow-sm sm:block" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-foreground sm:text-sm">{product?.name || 'Product'}</p>
                  <p className="text-sm font-extrabold text-[#e0b090]">₹{formatPriceINR(finalPrice)}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={(!isInStock || remainingStock <= 0) && !cartItem}
                onClick={() => {
                  if (cartItem) {
                    removeItem(product?.id);
                    toast({
                      title: 'Removed from cart',
                      description: `${product?.name || 'Product'} has been removed.`,
                      duration: ADD_TO_CART_TOAST_DURATION,
                    });
                  } else {
                    handleAddToCart();
                  }
                }}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[11px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap active:scale-[0.97] sm:px-8 shadow-sm hover:shadow-md ${cartItem
                    ? 'bg-[#03a685] text-white hover:bg-[#028b6f]'
                    : 'bg-gradient-to-r from-[#02a77d] to-[#06c78e] text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
              >
                {cartItem ? <Check size={16} /> : <ShoppingBag size={16} />}
                {cartItem ? 'Added' : 'Add to Cart'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ProductDetail;
