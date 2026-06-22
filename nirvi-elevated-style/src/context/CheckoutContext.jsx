import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CheckoutContext = createContext(undefined);
const SAVED_ADDRESSES_KEY = 'vris-checkout-addresses';
const SELECTED_ADDRESS_ID_KEY = 'vris-checkout-selected-address-id';
const CHECKOUT_COUPON_KEY = 'vris-checkout-coupon';
const CHECKOUT_DONATION_KEY = 'vris-checkout-donation';
const CHECKOUT_GIFTING_KEY = 'vris-checkout-gifting';
const DEFAULT_GIFT_WRAP_CHARGE = 35;
const ORDERS_REFRESH_INTERVAL_MS = 45 * 1000;

const normalizeOrderStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  const map = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    confirmed: 'Processing',
  };
  return map[normalized] || 'Pending';
};

const readStorage = (key, fallbackValue) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in private browsing or quota-limited environments.
  }
};

const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in private browsing or quota-limited environments.
  }
};

const normalizeCouponPayload = (coupon) => {
  if (!coupon || !coupon.code) {
    return null;
  }

  const code = String(coupon.code).trim().toUpperCase();
  if (!code) {
    return null;
  }

  const discountAmount = Number(coupon.discountAmount || 0);
  const discountPercent = Number(coupon.discountPercent || 0);
  const orderAmount = Number(coupon.orderAmount || 0);

  return {
    code,
    discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
    orderAmount: Number.isFinite(orderAmount) ? orderAmount : 0,
  };
};

const normalizeDonationPayload = (donation) => {
  if (!donation) {
    return null;
  }

  const amount = Number(donation.amount || 0);
  const enabled = Boolean(donation.enabled) && Number.isFinite(amount) && amount > 0;

  if (!enabled) {
    return null;
  }

  return {
    enabled: true,
    amount,
  };
};

const normalizeGiftingPayload = (gifting) => {
  if (!gifting || !gifting.enabled) {
    return null;
  }

  const message = typeof gifting.message === 'string'
    ? gifting.message.slice(0, 240)
    : '';

  return {
    enabled: true,
    amount: DEFAULT_GIFT_WRAP_CHARGE,
    message,
  };
};

export const CheckoutProvider = ({ children }) => {
  const { isAuthenticated, user, updateProfile } = useAuth();
  const [checkoutSource, setCheckoutSource] = useState('cart');
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [selectedCartItemIds, setSelectedCartItemIds] = useState([]);
  const [checkoutCoupon, setCheckoutCouponState] = useState(() => readStorage(CHECKOUT_COUPON_KEY, null));
  const [checkoutDonation, setCheckoutDonationState] = useState(() => readStorage(CHECKOUT_DONATION_KEY, null));
  const [checkoutGifting, setCheckoutGiftingState] = useState(() => readStorage(CHECKOUT_GIFTING_KEY, null));
  const [savedAddresses, setSavedAddresses] = useState(() => readStorage(SAVED_ADDRESSES_KEY, []));
  const [selectedAddressId, setSelectedAddressId] = useState(() => readStorage(SELECTED_ADDRESS_ID_KEY, null));
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const selectAddress = useCallback((addressId) => {
    const nextId = addressId ? String(addressId) : null;
    setSelectedAddressId(nextId);

    if (nextId) {
      writeStorage(SELECTED_ADDRESS_ID_KEY, nextId);
      return;
    }

    removeStorage(SELECTED_ADDRESS_ID_KEY);
  }, []);

  // Fetch orders from backend when authenticated
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setOrdersError('');
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    try {
      const res = await ordersAPI.getMyOrders();
      const fetched = (res.data || []).map((order) => {
        const isGiftWrapEnabled = Boolean(order.gift_wrap_enabled);
        const giftWrapCharge = Number(order.gift_wrap_charge || DEFAULT_GIFT_WRAP_CHARGE);
        const normalizedGiftWrapCharge = Number.isFinite(giftWrapCharge) && giftWrapCharge > 0
          ? giftWrapCharge
          : DEFAULT_GIFT_WRAP_CHARGE;

        return {
          id: order.id,
          createdAt: order.created_at,
          status: normalizeOrderStatus(order.status),
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status || 'Pending',
          gifting: isGiftWrapEnabled
            ? {
              enabled: true,
              amount: normalizedGiftWrapCharge,
              message: String(order.gift_wrap_message || ''),
            }
            : null,
          donation: Boolean(order.donation_enabled)
            ? {
              enabled: true,
              amount: Number(order.donation_amount || 0),
            }
            : null,
          address: {
            fullName: order.address_fullname,
            mobile: order.address_mobile,
            pincode: order.address_pincode,
            city: order.address_city,
            state: order.address_state,
            fullAddress: order.address_full,
            landmark: order.address_landmark,
          },
          items: (order.items || []).map((item) => ({
            id: String(item.product_id),
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity || 0),
            image: item.image,
          })),
          totals: {
            subtotal: Number(order.total_price) - Number(order.delivery_charge || 0),
            deliveryCharge: Number(order.delivery_charge || 0),
            total: Number(order.total_price),
          },
        };
      });
      setOrders(fetched);
      setOrdersError('');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrdersError(err.data?.message || err.message || 'Failed to load your orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();

    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      fetchOrders();
    }, ORDERS_REFRESH_INTERVAL_MS);

    const handleFocus = () => {
      fetchOrders();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchOrders, isAuthenticated]);

  const setCheckoutCoupon = useCallback((coupon) => {
    const normalizedCoupon = normalizeCouponPayload(coupon);
    setCheckoutCouponState(normalizedCoupon);

    if (normalizedCoupon) {
      writeStorage(CHECKOUT_COUPON_KEY, normalizedCoupon);
      return;
    }

    removeStorage(CHECKOUT_COUPON_KEY);
  }, []);

  const clearCheckoutCoupon = useCallback(() => {
    setCheckoutCouponState(null);
    removeStorage(CHECKOUT_COUPON_KEY);
  }, []);

  const setCheckoutDonation = useCallback((donation) => {
    const normalizedDonation = normalizeDonationPayload(donation);
    setCheckoutDonationState(normalizedDonation);

    if (normalizedDonation) {
      writeStorage(CHECKOUT_DONATION_KEY, normalizedDonation);
      return;
    }

    removeStorage(CHECKOUT_DONATION_KEY);
  }, []);

  const clearCheckoutDonation = useCallback(() => {
    setCheckoutDonationState(null);
    removeStorage(CHECKOUT_DONATION_KEY);
  }, []);

  const setCheckoutGifting = useCallback((gifting) => {
    const normalizedGifting = normalizeGiftingPayload(gifting);
    setCheckoutGiftingState(normalizedGifting);

    if (normalizedGifting) {
      writeStorage(CHECKOUT_GIFTING_KEY, normalizedGifting);
      return;
    }

    removeStorage(CHECKOUT_GIFTING_KEY);
  }, []);

  const clearCheckoutGifting = useCallback(() => {
    setCheckoutGiftingState(null);
    removeStorage(CHECKOUT_GIFTING_KEY);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user || savedAddresses.length > 0) {
      return;
    }

    if (!user.default_address_enabled) {
      return;
    }

    const addressLine1 = String(user.address_line1 || '').trim();
    const city = String(user.city || '').trim();
    const state = String(user.state || '').trim();
    const pincode = String(user.pincode || '').trim();

    if (!addressLine1 || !city || !state || !pincode) {
      return;
    }

    const nextAddress = {
      id: 'profile-default',
      fullName: String(user.name || '').trim() || 'VRIS User',
      mobile: String(user.phone || '').trim(),
      pincode,
      city,
      state,
      fullAddress: `${addressLine1}${user.address_line2 ? `, ${String(user.address_line2).trim()}` : ''}`,
      landmark: '',
    };

    setSavedAddresses([nextAddress]);
    writeStorage(SAVED_ADDRESSES_KEY, [nextAddress]);
    selectAddress(nextAddress.id);
  }, [isAuthenticated, selectAddress, user]);

  useEffect(() => {
    if (savedAddresses.length === 0) {
      if (selectedAddressId) {
        selectAddress(null);
      }
      return;
    }

    if (!selectedAddressId) {
      selectAddress(savedAddresses[0]?.id || null);
      return;
    }

    const hasSelectedAddress = savedAddresses.some((address) => String(address.id) === String(selectedAddressId));
    if (!hasSelectedAddress) {
      selectAddress(savedAddresses[0]?.id || null);
    }
  }, [savedAddresses, selectAddress, selectedAddressId]);

  const startCheckout = (payload) => {
    if (payload?.source === 'buyNow' && payload.item) {
      const qty = Math.max(1, Number(payload.item.quantity) || 1);
      setCheckoutSource('buyNow');
      setBuyNowItem({ ...payload.item, quantity: qty });
      setSelectedCartItemIds([]);
      clearCheckoutCoupon();
      clearCheckoutDonation();
      clearCheckoutGifting();
      return;
    }

    if (payload?.source === 'cart') {
      const nextSelectedIds = Array.isArray(payload.selectedItemIds)
        ? payload.selectedItemIds.map((id) => String(id))
        : [];

      setCheckoutSource('cart');
      setBuyNowItem(null);
      setSelectedCartItemIds(nextSelectedIds);

      if (Object.prototype.hasOwnProperty.call(payload, 'appliedCoupon')) {
        setCheckoutCoupon(payload.appliedCoupon);
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'appliedDonation')) {
        setCheckoutDonation(payload.appliedDonation);
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'appliedGifting')) {
        setCheckoutGifting(payload.appliedGifting);
      }

      return;
    }

    setCheckoutSource('cart');
    setBuyNowItem(null);
    setSelectedCartItemIds([]);
    clearCheckoutCoupon();
    clearCheckoutDonation();
    clearCheckoutGifting();
  };

  const saveAddress = (addressPayload) => {
    const nextAddress = {
      id: addressPayload.id || `addr-${Date.now()}`,
      fullName: addressPayload.fullName,
      mobile: addressPayload.mobile,
      pincode: addressPayload.pincode,
      city: addressPayload.city,
      state: addressPayload.state,
      fullAddress: addressPayload.fullAddress,
      landmark: addressPayload.landmark || '',
    };

    const nextAddresses = [nextAddress, ...savedAddresses.filter((address) => address.id !== nextAddress.id)];
    setSavedAddresses(nextAddresses);
    writeStorage(SAVED_ADDRESSES_KEY, nextAddresses);
    selectAddress(nextAddress.id);
    return nextAddress;
  };

  const deleteAddress = useCallback(async (addressId) => {
    const nextAddresses = savedAddresses.filter((address) => address.id !== addressId);
    setSavedAddresses(nextAddresses);
    writeStorage(SAVED_ADDRESSES_KEY, nextAddresses);

    if (String(selectedAddressId) === String(addressId)) {
      selectAddress(nextAddresses[0]?.id || null);
    }

    // If it was the profile-default address, we should also clear the user profile in the backend
    if (addressId === 'profile-default') {
      try {
        await updateProfile({
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          defaultAddressEnabled: false,
        });
      } catch (err) {
        console.error('Failed to sync address deletion with profile:', err);
      }
    }
  }, [savedAddresses, selectAddress, selectedAddressId, updateProfile]);

  const selectedAddress = useMemo(
    () => savedAddresses.find((address) => String(address.id) === String(selectedAddressId)) || null,
    [savedAddresses, selectedAddressId],
  );

  const placeOrder = async ({
    items,
    subtotal,
    deliveryCharge,
    total,
    gifting,
    donation,
    selectedAddressOverride,
    paymentMethodOverride,
    paymentStatus,
    paymentId,
    razorpayOrderId,
  }) => {
    const addressToUse = selectedAddressOverride || selectedAddress;

    if (!addressToUse) {
      throw new Error('Select a delivery address before placing the order.');
    }

    const giftingPayload = normalizeGiftingPayload(gifting || checkoutGifting);
    const donationPayload = normalizeDonationPayload(donation || checkoutDonation);

    // Call backend API
    const orderPayload = {
      items: items.map((item) => ({
        productId: parseInt(item.id, 10),
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        image: item.image,
      })),
      totalPrice: total,
      deliveryCharge: deliveryCharge || 0,
      paymentMethod: paymentMethodOverride || paymentMethod,
      paymentStatus: paymentStatus || 'Pending',
      paymentId: paymentId || null,
      razorpayOrderId: razorpayOrderId || null,
      gifting: giftingPayload,
      donation: donationPayload,
      address: addressToUse,
    };

    try {
      const res = await ordersAPI.place(orderPayload);
      const order = {
        id: res.data.id,
        createdAt: new Date().toISOString(),
        status: 'Pending',
        paymentMethod: paymentMethodOverride || paymentMethod,
        address: addressToUse,
        items,
        gifting: giftingPayload,
        totals: { subtotal, deliveryCharge, total },
        paymentStatus: orderPayload.paymentStatus,
      };

      setOrders((prev) => [order, ...prev]);
      return order;
    } catch (err) {
      console.error('Place order error:', err);
      throw new Error(err.data?.message || err.message || 'Failed to place order.');
    }
  };

  const value = {
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
    orders,
    ordersLoading,
    ordersError,
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
    refreshOrders: fetchOrders,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
};
