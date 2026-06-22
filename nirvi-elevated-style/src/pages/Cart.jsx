import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import AddressSection from '@/components/cart/AddressSection';
import OffersSection from '@/components/cart/OffersSection';
import CartItem from '@/components/cart/CartItem';
import PriceDetails from '@/components/cart/PriceDetails';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { useCatalog } from '@/context/CatalogContext';
import { useWishlist } from '@/context/WishlistContext';
import { couponsAPI } from '@/lib/api';
import { getEntityStock } from '@/lib/stock';

const SHIPPING_FREE_THRESHOLD = 999;

const shuffleProducts = (list) => {
  const next = [...list];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
};

const buildDeliveryEstimate = (offset) => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + offset);

  const dayName = deliveryDate.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = deliveryDate.toLocaleDateString('en-US', { month: 'short' });
  const dayOfMonth = String(deliveryDate.getDate()).padStart(2, '0');
  const label = `Delivery by ${dayName}, ${monthName} ${dayOfMonth}`;

  return { deliveryDate, label };
};

const Cart = () => {
  const navigate = useNavigate();
  const { items, increment, decrement, removeItem } = useCart();
  const {
    selectedAddress,
    checkoutCoupon,
    checkoutDonation,
    checkoutGifting,
    startCheckout,
    setCheckoutCoupon,
    clearCheckoutCoupon,
    setCheckoutDonation,
    clearCheckoutDonation,
    setCheckoutGifting,
    clearCheckoutGifting,
  } = useCheckout();
  const { products } = useCatalog();
  const { toggle, isWishlisted } = useWishlist();

  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const selectionInitializedRef = useRef(false);
  const previousCartItemIdsRef = useRef([]);

  const [couponCode, setCouponCode] = useState(() => checkoutCoupon?.code || '');
  const [appliedCoupon, setAppliedCoupon] = useState(() => checkoutCoupon || null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const donationEnabled = Boolean(checkoutDonation?.enabled);
  const donationAmount = useMemo(() => {
    const amount = Number(checkoutDonation?.amount || 10);
    return Number.isFinite(amount) && amount > 0 ? amount : 10;
  }, [checkoutDonation]);

  const giftingEnabled = Boolean(checkoutGifting?.enabled);
  const giftingAmount = useMemo(() => {
    const amount = Number(checkoutGifting?.amount || 35);
    return Number.isFinite(amount) && amount > 0 ? amount : 35;
  }, [checkoutGifting]);
  const giftingMessage = String(checkoutGifting?.message || '');

  const liveStockByProductId = useMemo(
    () => new Map(products.map((product) => [String(product.id), getEntityStock(product, 0)])),
    [products],
  );

  const catalogProductById = useMemo(
    () => new Map(products.map((product) => [String(product.id), product])),
    [products],
  );

  const cartItemsWithDetails = useMemo(
    () => items.map((item, index) => {
      const productId = String(item.id);
      const catalogProduct = catalogProductById.get(productId) || {};
      const liveStock = liveStockByProductId.get(productId);

      const itemStockValue = Number(item.stock);
      const fallbackStock = Number.isFinite(itemStockValue) ? itemStockValue : null;
      const stock = liveStock !== undefined ? liveStock : fallbackStock;
      const isUnavailable = stock !== null && stock <= 0;
      const atStockLimit = stock !== null && Number(item.quantity || 0) >= stock;

      const unitPriceValue = Number(item.price);
      const unitPrice = Number.isFinite(unitPriceValue) && unitPriceValue > 0 ? unitPriceValue : 0;

      const catalogMrpValue = Number(catalogProduct.mrp ?? catalogProduct.price ?? unitPrice);
      const mrp = Number.isFinite(catalogMrpValue) && catalogMrpValue > unitPrice ? catalogMrpValue : unitPrice;

      const discountPercent = mrp > 0 ? ((mrp - unitPrice) / mrp) * 100 : 0;
      const hasDiscount = discountPercent > 0.5;

      const quantity = Number(item.quantity || 0);
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      const mrpLineTotal = Number((mrp * quantity).toFixed(2));

      const estimate = buildDeliveryEstimate(7);

      return {
        ...item,
        category: item.category || catalogProduct.category || 'VRIS Collection',
        shortDescription: String(catalogProduct.description || item.category || 'Premium curated product').slice(0, 85),
        seller: catalogProduct.brand ? `${catalogProduct.brand} Store` : 'VRIS Partner',
        sizeLabel: 'One Size',
        stock,
        isUnavailable,
        atStockLimit,
        unitPrice,
        lineTotal,
        mrpLineTotal,
        pricing: {
          mrp,
          finalPrice: unitPrice,
          hasDiscount,
          discountLabel: Math.max(0, Math.round(discountPercent)),
        },
        deliveryDate: estimate.deliveryDate,
        deliveryEstimate: estimate.label,
      };
    }),
    [catalogProductById, items, liveStockByProductId],
  );

  const recommendationProducts = useMemo(() => {
    const cartItemIdSet = new Set(items.map((item) => String(item.id)));
    const cartCategorySet = new Set(
      cartItemsWithDetails
        .map((item) => String(item.category || '').trim().toLowerCase())
        .filter(Boolean),
    );

    const availableProducts = products.filter((product) => {
      const productId = String(product?.id ?? product?.product_id ?? '');
      if (!productId || cartItemIdSet.has(productId)) {
        return false;
      }

      return getEntityStock(product, 0) > 0;
    });

    const sameCategory = [];
    const fallback = [];

    availableProducts.forEach((product) => {
      const productCategory = String(product.category || '').trim().toLowerCase();
      if (productCategory && cartCategorySet.has(productCategory)) {
        sameCategory.push(product);
        return;
      }

      fallback.push(product);
    });

    return [...sameCategory, ...shuffleProducts(fallback)].slice(0, 18);
  }, [cartItemsWithDetails, items, products]);

  useEffect(() => {
    const evaluateRecommendationVisibility = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY > 180 || scrollableHeight <= 140) {
        setShowRecommendations(true);
      }
    };

    evaluateRecommendationVisibility();
    window.addEventListener('scroll', evaluateRecommendationVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', evaluateRecommendationVisibility);
    };
  }, []);

  useEffect(() => {
    if (!checkoutCoupon) {
      setAppliedCoupon(null);
      setCouponCode('');
      return;
    }

    setAppliedCoupon(checkoutCoupon);
    setCouponCode(checkoutCoupon.code || '');
    setCouponMessage(`Coupon Applied: ${checkoutCoupon.code}`);
    setCouponError('');
  }, [checkoutCoupon]);

  useEffect(() => {
    const itemIds = cartItemsWithDetails.map((item) => String(item.id));
    const previousItemIds = previousCartItemIdsRef.current;
    const previousItemIdSet = new Set(previousItemIds);

    setSelectedItemIds((prevSelected) => {
      const prevSelectedSet = new Set(prevSelected.map(String));
      const currentItemIdSet = new Set(itemIds);

      if (!selectionInitializedRef.current) {
        selectionInitializedRef.current = true;
        previousCartItemIdsRef.current = itemIds;
        return itemIds;
      }

      const persistedSelection = itemIds.filter((id) => prevSelectedSet.has(id) && currentItemIdSet.has(id));
      const newlyAddedItems = itemIds.filter((id) => !previousItemIdSet.has(id));

      previousCartItemIdsRef.current = itemIds;

      return [...persistedSelection, ...newlyAddedItems];
    });
  }, [cartItemsWithDetails]);

  const selectedIdSet = useMemo(
    () => new Set(selectedItemIds.map(String)),
    [selectedItemIds],
  );

  const selectedItems = useMemo(
    () => cartItemsWithDetails.filter((item) => selectedIdSet.has(String(item.id))),
    [cartItemsWithDetails, selectedIdSet],
  );

  const unavailableSelectedItems = useMemo(
    () => selectedItems.filter((item) => item.isUnavailable),
    [selectedItems],
  );

  const selectedCount = selectedItems.length;
  const totalCount = cartItemsWithDetails.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const selectedMrpTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.mrpLineTotal, 0),
    [selectedItems],
  );

  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [selectedItems],
  );

  const pricingBreakdown = useMemo(() => {
    const productTotal = Number(selectedMrpTotal.toFixed(2));
    const productDiscount = Number(Math.max(productTotal - selectedSubtotal, 0).toFixed(2));
    const rawCouponDiscount = Number(appliedCoupon?.discountAmount || 0);
    const couponDiscount = Number(Math.max(0, Math.min(rawCouponDiscount, selectedSubtotal)).toFixed(2));
    const subtotal = Number((selectedSubtotal - couponDiscount).toFixed(2));
    const shippingFee = subtotal === 0 || subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : 49;
    const donationValue = donationEnabled ? donationAmount : 0;
    const giftingValue = giftingEnabled ? giftingAmount : 0;
    const totalAmount = Number((subtotal + shippingFee + donationValue + giftingValue).toFixed(2));
    const youSaved = Number((productDiscount + couponDiscount).toFixed(2));

    return {
      productTotal,
      productDiscount,
      couponDiscount,
      subtotal,
      shippingFee,
      donationValue,
      giftingValue,
      totalAmount,
      youSaved,
    };
  }, [appliedCoupon, donationAmount, donationEnabled, giftingAmount, giftingEnabled, selectedMrpTotal, selectedSubtotal]);

  const {
    productTotal,
    productDiscount,
    couponDiscount,
    subtotal,
    shippingFee,
    totalAmount,
    youSaved,
  } = pricingBreakdown;

  useEffect(() => {
    if (!appliedCoupon) {
      return;
    }

    const appliedAmount = Number(appliedCoupon.orderAmount || 0).toFixed(2);
    if (appliedAmount !== Number(selectedSubtotal).toFixed(2)) {
      setAppliedCoupon(null);
      clearCheckoutCoupon();
      setCouponMessage('Coupon removed because selected items changed.');
    }
  }, [appliedCoupon, clearCheckoutCoupon, selectedSubtotal]);

  const deliveryInfo = useMemo(() => {
    if (selectedItems.length === 0) {
      return 'Select items to see expected delivery timeline.';
    }

    const earliestDate = selectedItems.reduce((earliest, item) => (
      item.deliveryDate < earliest ? item.deliveryDate : earliest
    ), selectedItems[0].deliveryDate);

    const dayName = earliestDate.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = earliestDate.toLocaleDateString('en-US', { month: 'short' });
    const dayOfMonth = String(earliestDate.getDate()).padStart(2, '0');
    return `Get it by ${dayName}, ${monthName} ${dayOfMonth}`;
  }, [selectedItems]);

  const canProceedToCheckout = selectedCount > 0 && unavailableSelectedItems.length === 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
      return;
    }

    setSelectedItemIds(cartItemsWithDetails.map((item) => String(item.id)));
  };

  const toggleItemSelection = (itemId) => {
    const normalizedId = String(itemId);

    setSelectedItemIds((current) => (
      current.includes(normalizedId)
        ? current.filter((id) => id !== normalizedId)
        : [...current, normalizedId]
    ));
  };

  const handleApplyCoupon = async () => {
    const normalizedCode = String(couponCode || '').trim().toUpperCase();

    if (!normalizedCode) {
      setCouponError('Enter a coupon code first.');
      setCouponMessage('');
      return;
    }

    if (selectedSubtotal <= 0) {
      setCouponError('Select items before applying a coupon.');
      setCouponMessage('');
      return;
    }

    setCouponError('');
    setCouponMessage('');
    setIsApplyingCoupon(true);

    try {
      const response = await couponsAPI.apply(normalizedCode, selectedSubtotal);
      const couponData = response.data || {};
      const normalizedCoupon = {
        code: couponData.code || normalizedCode,
        discountAmount: Number(couponData.discountAmount || 0),
        orderAmount: Number(couponData.orderAmount || selectedSubtotal),
      };

      setAppliedCoupon(normalizedCoupon);
      setCheckoutCoupon(normalizedCoupon);

      setCouponCode(couponData.code || normalizedCode);
      setCouponMessage(`Coupon Applied: ${normalizedCoupon.code}`);
    } catch (err) {
      setAppliedCoupon(null);
      clearCheckoutCoupon();
      setCouponError(err.data?.message || err.message || 'Unable to apply coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    clearCheckoutCoupon();
    setCouponMessage('Coupon removed.');
    setCouponError('');
  };

  const handleRemoveSelectedItems = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    await Promise.all(selectedItems.map((item) => removeItem(item.id)));
    setCouponMessage('Selected items removed.');
  };

  const handleMoveSelectedToWishlist = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    selectedItems.forEach((item) => {
      if (!isWishlisted(String(item.id))) {
        toggle(String(item.id));
      }
    });

    await Promise.all(selectedItems.map((item) => removeItem(item.id)));

    setCouponMessage('Selected items moved to wishlist.');
  };

  const handleMoveSingleToWishlist = async (itemId) => {
    const normalizedId = String(itemId);

    if (!isWishlisted(normalizedId)) {
      toggle(normalizedId);
    }

    await removeItem(normalizedId);
    setCouponMessage('Item moved to wishlist.');
  };

  const handleCheckout = () => {
    if (!canProceedToCheckout) {
      return;
    }

    startCheckout({
      source: 'cart',
      selectedItemIds: selectedItems.map((item) => String(item.id)),
      appliedCoupon,
      appliedDonation: donationEnabled ? { enabled: true, amount: donationAmount } : null,
      appliedGifting: giftingEnabled
        ? { enabled: true, amount: giftingAmount, message: giftingMessage }
        : null,
    });
    navigate('/checkout');
  };

  const handleToggleDonation = (enabled) => {
    if (!enabled) {
      clearCheckoutDonation();
      return;
    }

    setCheckoutDonation({ enabled: true, amount: donationAmount });
  };

  const handleSelectDonation = (amount) => {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return;
    }

    setCheckoutDonation({ enabled: true, amount: normalizedAmount });
  };

  const handleToggleGifting = (enabled) => {
    if (!enabled) {
      clearCheckoutGifting();
      return;
    }

    setCheckoutGifting({
      enabled: true,
      amount: 35,
      message: giftingMessage,
    });
  };

  const handleGiftingMessageChange = (message) => {
    setCheckoutGifting({
      enabled: true,
      amount: 35,
      message,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="w-full px-4 pb-20 pt-[96px] md:pt-[104px] sm:px-8 md:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-[1240px]">
          <h1 className="mb-6 text-3xl font-bold text-[#111827] sm:text-4xl">Your Cart</h1>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-[#ebedf0] bg-white px-6 py-16 text-center shadow-sm">
              <ShoppingBag size={52} className="mx-auto text-[#9ca3af]" />
              <p className="mt-4 text-base text-[#6b7280]">Your cart is currently empty.</p>
              <Link
                to="/shop"
                className="mt-6 inline-flex rounded-xl bg-[#e0b090] px-8 py-3 text-xs font-extrabold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.01] hover:bg-[#d6a382]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.72fr)_minmax(340px,1fr)] lg:gap-8">
                <section className="space-y-4">
                  <AddressSection
                    address={selectedAddress}
                    onChangeAddress={() => navigate('/checkout#address-section')}
                  />

                  <OffersSection />

                  <div className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-lg font-bold text-[#1f2937]">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-[#d1d5db] text-[#e0b090] focus:ring-[#ffc6d6]"
                        />
                        {selectedCount}/{totalCount} Items Selected
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRemoveSelectedItems}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#f3d0da] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ef4444] transition-colors hover:bg-[#fbf5f1]"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                        <button
                          type="button"
                          onClick={handleMoveSelectedToWishlist}
                          className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#374151] transition-colors hover:bg-[#f9fafb]"
                        >
                          Move to Wishlist
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cartItemsWithDetails.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        checked={selectedIdSet.has(String(item.id))}
                        onToggle={() => toggleItemSelection(item.id)}
                        onIncrement={() => increment(item.id)}
                        onDecrement={() => decrement(item.id)}
                        onRemove={() => removeItem(item.id)}
                        onMoveToWishlist={() => handleMoveSingleToWishlist(item.id)}
                        canEdit
                      />
                    ))}
                  </div>

                  {selectedCount === 0 ? (
                    <p className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-sm text-[#9a3412]">
                      Select at least one item to continue.
                    </p>
                  ) : null}

                  {unavailableSelectedItems.length > 0 ? (
                    <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#dc2626]">
                      Remove unavailable selected items before placing the order.
                    </p>
                  ) : null}
                </section>

                <PriceDetails
                  selectedCount={selectedCount}
                  totalCount={totalCount}
                  mrpTotal={productTotal}
                  discountOnMrp={productDiscount}
                  couponDiscount={couponDiscount}
                  subtotal={subtotal}
                  shippingFee={shippingFee}
                  donationEnabled={donationEnabled}
                  donationAmount={donationAmount}
                  giftingEnabled={giftingEnabled}
                  giftingAmount={giftingAmount}
                  giftingMessage={giftingMessage}
                  totalAmount={totalAmount}
                  youSaved={youSaved}
                  deliveryInfo={deliveryInfo}
                  couponCode={couponCode}
                  onCouponCodeChange={setCouponCode}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                  isApplyingCoupon={isApplyingCoupon}
                  appliedCoupon={appliedCoupon}
                  couponMessage={couponMessage}
                  couponError={couponError}
                  onToggleDonate={handleToggleDonation}
                  onSelectDonation={handleSelectDonation}
                  onToggleGifting={handleToggleGifting}
                  onGiftingMessageChange={handleGiftingMessageChange}
                  onPlaceOrder={handleCheckout}
                  placeOrderDisabled={!canProceedToCheckout}
                />
              </div>

              {showRecommendations && recommendationProducts.length > 0 ? (
                <section className="mt-16">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Smart Picks</p>
                      <h2 className="mt-1 text-2xl font-bold text-[#111827] sm:text-3xl">You May Also Like</h2>
                    </div>
                    <Link
                      to="/shop"
                      className="hidden text-xs font-bold uppercase tracking-[0.16em] text-[#e0b090] transition-colors hover:text-[#d6a382] sm:inline-flex"
                    >
                      Explore More
                    </Link>
                  </div>

                  <div className="mt-6 hidden gap-4 md:grid md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {recommendationProducts.map((product, index) => (
                      <ProductCard
                        key={`recommended-${String(product.id ?? product.product_id ?? index)}`}
                        product={product}
                        index={index}
                        ctaLabel="Add to Bag"
                      />
                    ))}
                  </div>

                  <div className="-mx-1 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
                    {recommendationProducts.map((product, index) => (
                      <div key={`recommended-mobile-${String(product.id ?? product.product_id ?? index)}`} className="w-[76vw] max-w-[280px] shrink-0 snap-start">
                        <ProductCard product={product} index={index} ctaLabel="Add to Bag" />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
