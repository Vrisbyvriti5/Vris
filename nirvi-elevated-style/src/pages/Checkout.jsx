import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, PackageCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { useCatalog } from '@/context/CatalogContext';
import { couponsAPI, ordersAPI } from '@/lib/api';
import { getEntityStock } from '@/lib/stock';
import { formatPriceINR } from '@/lib/pricing';
import { useToast } from '@/components/ui/use-toast';
import CartItem from '@/components/checkout/CartItem';
import OrderSummary from '@/components/checkout/OrderSummary';

const PAYMENT_OPTIONS = [
  { id: 'razorpay', label: 'Razorpay (UPI / Card / Net Banking / Wallets)' },
  { id: 'cod', label: 'Cash on Delivery (COD)' },
];

const emptyAddress = {
  fullName: '',
  mobile: '',
  pincode: '',
  city: '',
  state: '',
  fullAddress: '',
  landmark: '',
};

const deliveryChargeFor = (subtotal) => (subtotal >= 999 || subtotal === 0 ? 0 : 49);

const getDeliveryEstimate = (index) => {
  const estimateDate = new Date();
  estimateDate.setDate(estimateDate.getDate() + 7); // Exactly 7 days from today to match product page

  const dayName = estimateDate.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = estimateDate.toLocaleDateString('en-US', { month: 'short' });
  const dayOfMonth = String(estimateDate.getDate()).padStart(2, '0');
  return `Delivery by ${dayName}, ${monthName} ${dayOfMonth}`;
};

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let razorpaySdkPromise = null;

const loadRazorpaySdk = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpaySdkPromise) {
    return razorpaySdkPromise;
  }

  razorpaySdkPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => {
      resolve(Boolean(window.Razorpay));
    };
    script.onerror = () => {
      razorpaySdkPromise = null;
      script.remove();
      resolve(false);
    };

    document.body.appendChild(script);
  }).then((isLoaded) => {
    if (!isLoaded) {
      razorpaySdkPromise = null;
    }
    return isLoaded;
  });

  return razorpaySdkPromise;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { items: cartItems, clear, increment, decrement, removeItem } = useCart();
  const { products } = useCatalog();
  const { toast } = useToast();
  const {
    checkoutSource,
    buyNowItem,
    selectedCartItemIds,
    checkoutCoupon,
    checkoutDonation,
    checkoutGifting,
    savedAddresses,
    selectedAddressId,
    selectedAddress,
    paymentMethod,
    startCheckout,
    setCheckoutCoupon,
    clearCheckoutCoupon,
    setCheckoutDonation,
    clearCheckoutDonation,
    setCheckoutGifting,
    clearCheckoutGifting,
    saveAddress,
    deleteAddress,
    selectAddress,
    setPaymentMethod,
    placeOrder,
  } = useCheckout();

  const [step, setStep] = useState('address');
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressError, setAddressError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoadingPaymentSdk, setIsLoadingPaymentSdk] = useState(false);
  const [couponCode, setCouponCode] = useState(() => checkoutCoupon?.code || '');
  const [appliedCoupon, setAppliedCoupon] = useState(() => checkoutCoupon || null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const isMobileViewport = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 767px)').matches;
  }, []);

  const scrollToCheckoutTop = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const goToStep = useCallback((nextStep, options = {}) => {
    setStep(nextStep);
    if (options.scrollToTop) {
      scrollToCheckoutTop();
    }
  }, [scrollToCheckoutTop]);

  const incomingCheckoutPayload = location.state?.checkoutPayload;
  useEffect(() => {
    if (!incomingCheckoutPayload) return;
    startCheckout(incomingCheckoutPayload);
    navigate('/checkout', { replace: true, state: null });
  }, [incomingCheckoutPayload, navigate, startCheckout]);

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
    if (location.hash !== '#address-section') {
      return;
    }

    setStep('address');
    const timeoutId = window.setTimeout(() => {
      scrollToCheckoutTop();
    }, 70);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.hash, scrollToCheckoutTop]);

  useEffect(() => {
    if (step !== 'payment' || paymentMethod !== 'razorpay') {
      return;
    }

    loadRazorpaySdk();
  }, [step, paymentMethod]);

  const checkoutItems = useMemo(() => {
    if (checkoutSource === 'buyNow' && buyNowItem) {
      return [buyNowItem];
    }

    if (checkoutSource === 'cart' && selectedCartItemIds.length > 0) {
      const selectedSet = new Set(selectedCartItemIds.map((id) => String(id)));
      return cartItems.filter((item) => selectedSet.has(String(item.id)));
    }

    return cartItems;
  }, [buyNowItem, cartItems, checkoutSource, selectedCartItemIds]);

  const catalogProductById = useMemo(
    () => new Map(products.map((product) => [String(product.id), product])),
    [products],
  );

  const liveStockByProductId = useMemo(
    () => new Map(products.map((product) => [String(product.id), getEntityStock(product, 0)])),
    [products],
  );

  const checkoutItemsWithAvailability = useMemo(
    () => checkoutItems.map((item, index) => {
      const productId = String(item.id);
      const catalogProduct = catalogProductById.get(productId) || {};
      const liveStock = liveStockByProductId.get(productId);

      const itemStockValue = Number(item.stock);
      const fallbackStock = Number.isFinite(itemStockValue) ? itemStockValue : null;
      const stock = liveStock !== undefined ? liveStock : fallbackStock;
      const isUnavailable = stock !== null && stock <= 0;
      const atStockLimit = stock !== null && Number(item.quantity || 0) >= stock;

      const itemPriceValue = Number(item.price);
      const unitPrice = Number.isFinite(itemPriceValue) && itemPriceValue > 0 ? itemPriceValue : 0;

      const catalogMrpValue = Number(catalogProduct.mrp ?? catalogProduct.price ?? unitPrice);
      const mrp = Number.isFinite(catalogMrpValue) && catalogMrpValue > unitPrice ? catalogMrpValue : unitPrice;

      const discountPercent = mrp > 0 ? ((mrp - unitPrice) / mrp) * 100 : 0;
      const hasDiscount = discountPercent > 0.5;
      const pricing = {
        mrp,
        finalPrice: unitPrice,
        hasDiscount,
        discountLabel: Math.max(0, Math.round(discountPercent)),
      };

      const quantity = Number(item.quantity || 0);
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      const mrpLineTotal = Number((mrp * quantity).toFixed(2));

      return {
        ...item,
        category: item.category || catalogProduct.category || 'VRIS Collection',
        stock,
        isUnavailable,
        atStockLimit,
        unitPrice,
        pricing,
        lineTotal,
        mrpLineTotal,
        deliveryEstimate: getDeliveryEstimate(index),
      };
    }),
    [catalogProductById, checkoutItems, liveStockByProductId],
  );

  const unavailableCheckoutItems = useMemo(
    () => checkoutItemsWithAvailability.filter((item) => item.isUnavailable),
    [checkoutItemsWithAvailability],
  );

  const hasUnavailableCheckoutItems = unavailableCheckoutItems.length > 0;

  const lineItemTotal = useMemo(
    () => checkoutItemsWithAvailability.reduce((sum, item) => sum + item.lineTotal, 0),
    [checkoutItemsWithAvailability],
  );

  const mrpTotal = useMemo(
    () => checkoutItemsWithAvailability.reduce((sum, item) => sum + item.mrpLineTotal, 0),
    [checkoutItemsWithAvailability],
  );


  const priceBreakdown = useMemo(() => {
    const productTotal = Number(mrpTotal.toFixed(2));
    const discountOnProducts = Number(Math.max(productTotal - lineItemTotal, 0).toFixed(2));
    const rawCouponDiscount = Number(appliedCoupon?.discountAmount || 0);
    const couponDiscount = Number(Math.max(0, Math.min(rawCouponDiscount, lineItemTotal)).toFixed(2));
    const subtotal = Number((lineItemTotal - couponDiscount).toFixed(2));
    const shipping = deliveryChargeFor(subtotal);
    const donation = Boolean(checkoutDonation?.enabled)
      ? Math.max(0, Number(checkoutDonation?.amount || 0))
      : 0;
    const gifting = Boolean(checkoutGifting?.enabled)
      ? Math.max(0, Number(checkoutGifting?.amount || 35))
      : 0;
    const finalTotal = Number((subtotal + shipping + donation + gifting).toFixed(2));

    return {
      productTotal,
      productDiscount: discountOnProducts,
      couponDiscount,
      subtotal,
      shipping,
      donation,
      gifting,
      finalTotal,
    };
  }, [appliedCoupon, checkoutDonation, checkoutGifting, lineItemTotal, mrpTotal]);

  useEffect(() => {
    if (!appliedCoupon) {
      return;
    }

    const appliedOrderAmount = Number(appliedCoupon.orderAmount || 0).toFixed(2);
    if (appliedOrderAmount !== Number(lineItemTotal).toFixed(2)) {
      setAppliedCoupon(null);
      clearCheckoutCoupon();
      setCouponMessage('Coupon was removed because checkout items changed.');
    }
  }, [appliedCoupon, clearCheckoutCoupon, lineItemTotal]);

  if (!isAuthenticated) {
    const checkoutPayload = checkoutSource === 'buyNow' && buyNowItem
      ? { source: 'buyNow', item: buyNowItem }
      : {
        source: 'cart',
        selectedItemIds: selectedCartItemIds,
        appliedCoupon: checkoutCoupon,
        appliedDonation: checkoutDonation,
        appliedGifting: checkoutGifting,
      };
    return <Navigate to="/login" replace state={{ redirectTo: '/checkout', checkoutPayload }} />;
  }

  const {
    productTotal,
    productDiscount,
    couponDiscount,
    subtotal,
    shipping,
    donation,
    gifting,
    finalTotal,
  } = priceBreakdown;
  const hasSelectedAddress = Boolean(selectedAddress);
  const canEditCheckoutItems = checkoutSource === 'cart';

  const handleApplyCoupon = async () => {
    const normalizedCode = String(couponCode || '').trim().toUpperCase();

    if (!normalizedCode) {
      setCouponError('Enter a coupon code first.');
      setCouponMessage('');
      return;
    }

    if (lineItemTotal <= 0) {
      setCouponError('Add items to checkout before applying a coupon.');
      setCouponMessage('');
      return;
    }

    setCouponError('');
    setCouponMessage('');
    setIsApplyingCoupon(true);

    try {
      const response = await couponsAPI.apply(normalizedCode, lineItemTotal);
      const couponData = response.data || {};
      const normalizedCoupon = {
        code: couponData.code || normalizedCode,
        discountAmount: Number(couponData.discountAmount || 0),
        discountPercent: Number(couponData.discountPercent || 0),
        orderAmount: Number(couponData.orderAmount || lineItemTotal),
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

  const handleToggleDonation = (enabled) => {
    if (!enabled) {
      clearCheckoutDonation();
      return;
    }

    const currentAmount = Number(checkoutDonation?.amount || 10);
    const normalizedAmount = Number.isFinite(currentAmount) && currentAmount > 0 ? currentAmount : 10;
    setCheckoutDonation({ enabled: true, amount: normalizedAmount });
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
      message: String(checkoutGifting?.message || ''),
    });
  };

  const handleGiftingMessageChange = (message) => {
    setCheckoutGifting({
      enabled: true,
      amount: 35,
      message,
    });
  };

  const validateAddress = () => {
    if (!addressForm.fullName.trim()) return 'Full name is required.';
    if (!/^\d{10}$/.test(addressForm.mobile.trim())) return 'Mobile number must be 10 digits.';
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) return 'Pincode must be 6 digits.';
    if (!addressForm.city.trim()) return 'City is required.';
    if (!addressForm.state.trim()) return 'State is required.';
    if (addressForm.fullAddress.trim().length < 10) return 'Full address should be at least 10 characters.';
    return '';
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const error = validateAddress();
    if (error) {
      setAddressError(error);
      return;
    }

    setAddressError('');
    const wasEditingAddress = Boolean(editingAddressId);
    saveAddress({
      ...(editingAddressId ? { id: editingAddressId } : {}),
      ...addressForm,
      fullName: addressForm.fullName.trim(),
      mobile: addressForm.mobile.trim(),
      pincode: addressForm.pincode.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      fullAddress: addressForm.fullAddress.trim(),
      landmark: addressForm.landmark.trim(),
    });
    setEditingAddressId(null);
    setAddressForm(emptyAddress);

    toast({
      title: wasEditingAddress ? 'Address updated' : 'Address saved',
      description: wasEditingAddress
        ? 'Your delivery address has been updated successfully.'
        : 'Your delivery address has been saved successfully.',
    });
  };

  const handleSelectSavedAddress = (addressId) => {
    const isSameAddress = String(selectedAddressId) === String(addressId);
    selectAddress(addressId);
    setEditingAddressId(null);
    setAddressError('');

    if (!isSameAddress) {
      toast({
        title: 'Address selected',
        description: 'This address will be used for delivery.',
      });
    }
  };

  const handleFocusAddressSection = () => {
    setAddressError('');
    goToStep('address');
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      fullName: address.fullName || '',
      mobile: address.mobile || '',
      pincode: address.pincode || '',
      city: address.city || '',
      state: address.state || '',
      fullAddress: address.fullAddress || '',
      landmark: address.landmark || '',
    });
    setAddressError('');
    goToStep('address');
  };

  const handleCancelAddressEdit = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
    setAddressError('');
  };

  const handleDeleteAddress = (addressId) => {
    if (String(editingAddressId) === String(addressId)) {
      handleCancelAddressEdit();
    }

    deleteAddress(addressId);
    toast({
      title: 'Address deleted',
      description: 'The selected address has been removed.',
    });
  };

  const handleContinueToItems = () => {
    if (hasUnavailableCheckoutItems) {
      setAddressError('One or more items are currently unavailable. Remove them to continue.');
      return;
    }

    if (!hasSelectedAddress) {
      setAddressError('Please select an address to continue.');
      return;
    }

    setAddressError('');
    goToStep('items', { scrollToTop: true });
  };

  const handleContinueToPayment = () => {
    if (hasUnavailableCheckoutItems) {
      setAddressError('One or more items are currently unavailable. Remove them to continue.');
      return;
    }

    if (!hasSelectedAddress) {
      setAddressError('Please add or select a delivery address before payment.');
      goToStep('address', { scrollToTop: true });
      return;
    }

    setAddressError('');
    goToStep('payment', { scrollToTop: true });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setAddressError('Please add or select a delivery address first.');
      goToStep('address');
      return;
    }

    if (checkoutItemsWithAvailability.length === 0) {
      setAddressError('No items selected for checkout.');
      return;
    }

    if (hasUnavailableCheckoutItems) {
      setAddressError('One or more items are currently unavailable. Remove them to place the order.');
      return;
    }

    setIsProcessingPayment(true);
    setIsLoadingPaymentSdk(false);
    setAddressError('');

    const giftingPayload = checkoutGifting?.enabled
      ? {
        enabled: true,
        amount: 35,
        message: String(checkoutGifting?.message || ''),
      }
      : null;

    try {
      let order;

      if (paymentMethod === 'razorpay') {
        setIsLoadingPaymentSdk(true);
        const sdkLoaded = await loadRazorpaySdk();
        setIsLoadingPaymentSdk(false);

        if (!sdkLoaded || !window.Razorpay) {
          throw new Error('Payment failed to load. Please disable adblock or try again.');
        }
      }

      if (paymentMethod === 'cod') {
        order = await placeOrder({
          items: checkoutItemsWithAvailability,
          subtotal: Number((subtotal + donation + gifting).toFixed(2)),
          deliveryCharge: shipping,
          total: finalTotal,
          gifting: giftingPayload,
          donation: checkoutDonation,
          selectedAddressOverride: selectedAddress,
          paymentMethodOverride: 'cod',
          paymentStatus: 'Pending',
        });
      } else {
        const createOrderData = await ordersAPI.createRazorpayOrder(finalTotal);
        const razorpayOrder = createOrderData.data.order;
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

        if (!razorpayKey) {
          throw new Error('Payment configuration is missing. Please contact support.');
        }

        const paymentResult = await new Promise((resolve, reject) => {
          const razorpayInstance = new window.Razorpay({
            key: razorpayKey,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order_id: razorpayOrder.id,
            name: 'VRIS',
            description: 'Order payment',
            theme: { color: '#e0b090' },
            handler: async (response) => {
              try {
                await ordersAPI.verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                resolve({
                  razorpayOrderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                });
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled by user.')),
            },
            prefill: {
              name: selectedAddress.fullName,
              contact: selectedAddress.mobile,
              email: user?.email || '',
            },
            method: {
              upi: true,
              card: true,
              netbanking: true,
              wallet: true,
              emi: true,
              paylater: true,
            },
          });

          razorpayInstance.on('payment.failed', (resp) => {
            reject(new Error(resp?.error?.description || 'Razorpay payment failed.'));
          });
          razorpayInstance.open();
        });

        order = await placeOrder({
          items: checkoutItemsWithAvailability,
          subtotal: Number((subtotal + donation + gifting).toFixed(2)),
          deliveryCharge: shipping,
          total: finalTotal,
          gifting: giftingPayload,
          donation: checkoutDonation,
          selectedAddressOverride: selectedAddress,
          paymentMethodOverride: 'razorpay',
          paymentStatus: 'Paid',
          paymentId: paymentResult.paymentId,
          razorpayOrderId: paymentResult.razorpayOrderId,
        });
      }

      if (checkoutSource === 'cart') {
        const orderedItemIds = checkoutItemsWithAvailability.map((item) => String(item.id));

        if (orderedItemIds.length >= cartItems.length) {
          await clear();
        } else {
          for (const itemId of orderedItemIds) {
            await removeItem(itemId);
          }
        }
      }

      clearCheckoutCoupon();
      clearCheckoutDonation();
      clearCheckoutGifting();

      navigate('/orders', {
        state: {
          orderId: order.id,
          giftWrapAdded: Boolean(giftingPayload?.enabled),
        },
      });
    } catch (err) {
      setAddressError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoadingPaymentSdk(false);
      setIsProcessingPayment(false);
    }
  };

  const primaryAction = (() => {
    if (step === 'address') {
      return {
        label: 'Continue to Order Summary',
        disabled: !hasSelectedAddress,
        onClick: handleContinueToItems,
      };
    }

    if (step === 'items') {
      return {
        label: 'Proceed to Payment',
        disabled: checkoutItemsWithAvailability.length === 0,
        onClick: handleContinueToPayment,
      };
    }

    if (step === 'payment') {
      return {
        label: isLoadingPaymentSdk
          ? 'Loading Payment...'
          : isProcessingPayment
            ? 'Processing Payment...'
            : 'Pay Now',
        disabled: checkoutItemsWithAvailability.length === 0 || hasUnavailableCheckoutItems || isProcessingPayment || isLoadingPaymentSdk || !hasSelectedAddress,
        onClick: handlePlaceOrder,
      };
    }

    return {
      label: 'Continue',
      disabled: true,
      onClick: () => {},
    };
  })();

  const totalCheckoutQuantity = checkoutItemsWithAvailability.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const checkoutItemPreview = checkoutItemsWithAvailability.slice(0, 2).map((item) => item.name).join(', ');
  const activeSectionClasses = 'checkout-step-enter rounded-2xl border border-[#ebedf0] bg-white p-6 shadow-sm sm:p-8 lg:p-10';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="w-full px-4 pb-20 pt-24 sm:px-8 md:px-10 lg:px-14 xl:px-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Secure Checkout</p>
            <h1 className="mt-1 text-3xl font-bold text-[#111827] sm:text-4xl">Checkout</h1>
          </div>
          <p className="rounded-full border border-[#ebedf0] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
            {checkoutItemsWithAvailability.length} item(s)
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] lg:gap-8">
          <section className="space-y-4">
            {step !== 'address' ? (
              <div className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fbf5f1] text-[#e0b090]">
                      <MapPin size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Address</p>
                      {selectedAddress ? (
                        <>
                          <p className="mt-1 text-sm font-semibold text-[#111827]">{selectedAddress.fullName}</p>
                          <p className="mt-1 text-sm text-[#6b7280]">
                            {selectedAddress.fullAddress}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-[#111827]">Delivery address needed</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFocusAddressSection}
                    className="shrink-0 rounded-lg border border-[#ebd1c1] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#e0b090] transition-colors hover:bg-[#fbf5f1]"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : null}

            {step === 'payment' ? (
              <div className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eef6ff] text-[#2563eb]">
                      <PackageCheck size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Order Summary</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">
                        {totalCheckoutQuantity} item(s) - Rs {formatPriceINR(subtotal)}
                      </p>
                      {checkoutItemPreview ? (
                        <p className="mt-1 text-sm text-[#6b7280]">
                          {checkoutItemPreview}
                          {checkoutItemsWithAvailability.length > 2 ? ` +${checkoutItemsWithAvailability.length - 2} more` : ''}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep('items')}
                    className="shrink-0 rounded-lg border border-[#dbeafe] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2563eb] transition-colors hover:bg-[#eff6ff]"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : null}

            <div key={step} id={`${step}-section`} className={activeSectionClasses}>
              {step === 'address' ? (
                <>
                  <div className="border-b border-[#ebedf0] pb-6">
                    <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-[#111827] sm:text-3xl">
                      <MapPin size={22} /> Delivery Address
                    </h2>
                    <p className="mt-2 text-sm text-[#6b7280]">Select an address for this order.</p>
                  </div>

                  <div className="mt-8">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">
                        {editingAddressId ? 'Edit Address' : 'Add New Address'}
                      </p>
                      {editingAddressId ? (
                        <button
                          type="button"
                          onClick={handleCancelAddressEdit}
                          className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280] transition-colors hover:text-[#111827]"
                        >
                          Cancel Edit
                        </button>
                      ) : null}
                    </div>

                    <form onSubmit={handleSaveAddress} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input
                        className="h-11 rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
                        placeholder="Full Name"
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      />
                      <input
                        className="h-11 rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
                        placeholder="Mobile Number"
                        value={addressForm.mobile}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, mobile: e.target.value }))}
                      />
                      <input
                        className="h-11 rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
                        placeholder="Pincode"
                        value={addressForm.pincode}
                        onChange={async (e) => {
                          const value = e.target.value.replace(/\\D/g, '').slice(0, 6);
                          setAddressForm((prev) => ({ ...prev, pincode: value }));
                          if (value.length === 6) {
                            try {
                              const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
                              const data = await response.json();
                              if (data && data[0] && data[0].Status === 'Success') {
                                const postOffice = data[0].PostOffice[0];
                                setAddressForm(prev => ({
                                  ...prev,
                                  city: postOffice.District || postOffice.Block || prev.city,
                                  state: postOffice.State || prev.state
                                }));
                              }
                            } catch (err) {}
                          }
                        }}
                      />
                      <input
                        className="h-11 rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                      />
                      <input
                        className="h-11 rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                      />
                      <input
                        className="h-11 rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
                        placeholder="Landmark (Optional)"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, landmark: e.target.value }))}
                      />
                      <textarea
                        className="min-h-24 rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1] sm:col-span-2"
                        placeholder="Full Address"
                        value={addressForm.fullAddress}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, fullAddress: e.target.value }))}
                      />

                      <button
                        type="submit"
                        className="rounded-xl bg-[#111827] py-3 text-xs font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1f2937] sm:col-span-2"
                      >
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                      </button>
                    </form>

                    {savedAddresses.length > 0 ? (
                      <div className="mt-8 border-t border-[#ebedf0] pt-6">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Saved Addresses</p>
                        <div className="mt-3 space-y-3">
                          {savedAddresses.map((address) => {
                            const isSelected = String(selectedAddressId) === String(address.id);

                            return (
                              <div
                                key={address.id}
                                className={[
                                  'rounded-xl border p-3 transition-colors',
                                  isSelected
                                    ? 'border-[#e0b090] bg-[#fff5f8]'
                                    : 'border-[#ebedf0] bg-[#fafafa]',
                                ].join(' ')}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectSavedAddress(address.id)}
                                    className="flex-1 text-left"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-[#111827]">{address.fullName}</span>
                                      {isSelected ? (
                                        <span className="rounded-full bg-[#e0b090] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                                          Selected
                                        </span>
                                      ) : null}
                                    </span>
                                    <p className="mt-1 text-xs text-[#6b7280]">
                                      {address.fullAddress}, {address.city}, {address.state} - {address.pincode}
                                    </p>
                                  </button>

                                  <div className="flex shrink-0 items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditAddress(address)}
                                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAddress(address.id)}
                                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#dc2626] transition-colors hover:text-[#b91c1c]"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

              {step === 'items' ? (
                <>
                  <div className="border-b border-[#ebedf0] pb-6">
                    <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-[#111827] sm:text-3xl">
                      <PackageCheck size={22} /> Order Summary
                    </h2>
                    <p className="mt-2 text-sm text-[#6b7280]">{totalCheckoutQuantity} item(s) selected for checkout.</p>
                  </div>

                  <div className="mt-8 space-y-4">
                    {checkoutItemsWithAvailability.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#d1d5db] bg-[#fafafa] p-6 text-sm text-[#6b7280]">
                        No items selected for checkout. <Link to="/shop" className="font-semibold text-[#e0b090] hover:underline">Continue shopping</Link>
                      </div>
                    ) : (
                      checkoutItemsWithAvailability.map((item) => (
                        <CartItem
                          key={item.id}
                          item={item}
                          canEdit={canEditCheckoutItems}
                          onIncrement={() => increment(item.id)}
                          onDecrement={() => decrement(item.id)}
                          onRemove={() => removeItem(item.id)}
                        />
                      ))
                    )}

                    {!canEditCheckoutItems ? (
                      <p className="text-xs text-[#6b7280]">This is a Buy Now checkout. Quantity changes are available on the product page.</p>
                    ) : null}

                    {canEditCheckoutItems && checkoutItemsWithAvailability.length > 0 ? (
                      <button
                        type="button"
                        onClick={clear}
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280] transition-colors hover:text-[#111827]"
                      >
                        Clear All Items
                      </button>
                    ) : null}

                    {hasUnavailableCheckoutItems ? (
                      <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#dc2626]">
                        Some items are out of stock. Remove them to continue.
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}

              {step === 'payment' ? (
                <>
                  <div className="border-b border-[#ebedf0] pb-6">
                    <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-[#111827] sm:text-3xl">
                      <CreditCard size={22} /> Payment
                    </h2>
                    <p className="mt-2 text-sm text-[#6b7280]">Choose how you would like to complete this order.</p>
                  </div>

                  <div className="mt-8 space-y-3">
                    {PAYMENT_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className={[
                          'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                          paymentMethod === option.id
                            ? 'border-[#e0b090] bg-[#fbf5f1]'
                            : 'border-[#ebedf0] bg-[#fafafa] hover:border-[#ebd1c1]',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          checked={paymentMethod === option.id}
                          onChange={() => setPaymentMethod(option.id)}
                        />
                        <span className="text-sm text-[#4b5563]">{option.label}</span>
                      </label>
                    ))}

                    <p className="text-xs text-[#6b7280]">
                      COD places the order directly. Razorpay supports secure online payment for this order.
                    </p>

                    <div className="rounded-xl border border-[#ebedf0] bg-[#fafafa] p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Selected Payment Method</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">
                        {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay Online Payment'}
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Amount Payable</p>
                      <p className="mt-1 text-lg font-bold text-[#111827]">Rs {formatPriceINR(finalTotal)}</p>
                    </div>

                    {isProcessingPayment ? (
                      <p className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs font-medium text-[#1d4ed8]">
                        Processing Payment...
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            {step === 'address' && addressError ? <p className="text-sm text-[#dc2626]">{addressError}</p> : null}
          </section>

          <OrderSummary
            items={checkoutItemsWithAvailability}
            mrpTotal={mrpTotal}
            subtotal={subtotal}
            productDiscount={productDiscount}
            couponDiscount={couponDiscount}
            donationEnabled={Boolean(checkoutDonation?.enabled)}
            donationAmount={donation}
            giftingEnabled={Boolean(checkoutGifting?.enabled)}
            giftingAmount={gifting}
            giftingMessage={String(checkoutGifting?.message || '')}
            deliveryCharge={shipping}
            finalTotal={finalTotal}
            selectedAddress={selectedAddress}
            onToggleDonation={handleToggleDonation}
            onSelectDonation={handleSelectDonation}
            onToggleGifting={handleToggleGifting}
            onGiftingMessageChange={handleGiftingMessageChange}
            couponProps={{
              code: couponCode,
              onCodeChange: setCouponCode,
              onApply: handleApplyCoupon,
              onRemove: handleRemoveCoupon,
              isApplying: isApplyingCoupon,
              disabled: checkoutItemsWithAvailability.length === 0,
              appliedCoupon,
              message: couponMessage,
              error: couponError,
            }}
            ctaLabel={primaryAction.label}
            ctaDisabled={primaryAction.disabled}
            onCta={primaryAction.onClick}
            note={step !== 'address' ? addressError : ''}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
