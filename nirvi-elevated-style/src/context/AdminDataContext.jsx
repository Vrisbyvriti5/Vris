import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { usersAPI, ordersAPI, customizationsAPI } from '@/lib/api';
import { useAdminAuth } from '@/context/AdminAuthContext';

const AdminDataContext = createContext(undefined);
const AUTO_REFRESH_INTERVAL_MS = 45 * 1000;

const normalizeStatus = (value, fallback = 'Pending') => {
  const normalized = String(value || '').trim().toLowerCase();
  const map = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    confirmed: 'Processing',
    paid: 'Paid',
    failed: 'Failed',
  };

  return map[normalized] || fallback;
};

export const AdminDataProvider = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customizations, setCustomizations] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [customizationsLoading, setCustomizationsLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [customizationsError, setCustomizationsError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) {
      setUsers([]);
      setUsersError('');
      return [];
    }

    setUsersLoading(true);
    try {
      const res = await usersAPI.getAll();
      const mapped = (res.data || []).map((u) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'Active',
        joinedAt: u.created_at,
        lastSeen: 'Recently',
      }));

      setUsers(mapped);
      setUsersError('');
      return mapped;
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsersError(err.data?.message || err.message || 'Failed to load users.');
      return [];
    } finally {
      setUsersLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setOrdersError('');
      return [];
    }

    setOrdersLoading(true);
    try {
      const res = await ordersAPI.getAll();
      const mapped = (res.data || []).map((order) => {
        const giftWrapEnabled = Boolean(order.gift_wrap_enabled);
        const giftWrapCharge = Number(order.gift_wrap_charge || 35);
        const normalizedGiftWrapCharge = Number.isFinite(giftWrapCharge) && giftWrapCharge > 0 ? giftWrapCharge : 35;

        const donationEnabled = Boolean(order.donation_enabled);
        const donationAmount = Number(order.donation_amount || 0);
        const normalizedDonationAmount = Number.isFinite(donationAmount) && donationAmount > 0 ? donationAmount : 0;

        return {
          id: String(order.id),
          userId: String(order.user_id),
          userName: order.user_name || 'Unknown Customer',
          totalPrice: Number(order.total_price || 0),
          status: normalizeStatus(order.status, 'Pending'),
          paymentStatus: normalizeStatus(order.payment_status, 'Pending'),
          paymentMethod: order.payment_method || 'razorpay',
          gifting: giftWrapEnabled
            ? {
              enabled: true,
              amount: normalizedGiftWrapCharge,
              message: String(order.gift_wrap_message || ''),
            }
            : null,
          donation: donationEnabled
            ? {
              enabled: true,
              amount: normalizedDonationAmount,
            }
            : null,
          address: {
            fullName: order.address_fullname || '',
            mobile: order.address_mobile || '',
            pincode: order.address_pincode || '',
            city: order.address_city || '',
            state: order.address_state || '',
            fullAddress: order.address_full || '',
            landmark: order.address_landmark || '',
          },
          createdAt: order.created_at || order.createdAt,
          items: (order.items || []).map((item) => ({
            productId: String(item.product_id),
            name: item.name || 'Untitled Product',
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
          })),
        };
      });

      setOrders(mapped);
      setOrdersError('');
      return mapped;
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrdersError(err.data?.message || err.message || 'Failed to load orders.');
      return [];
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCustomizations = useCallback(async () => {
    if (!isAuthenticated) {
      setCustomizations([]);
      setCustomizationsError('');
      return [];
    }

    setCustomizationsLoading(true);
    try {
      const res = await customizationsAPI.getAll();
      setCustomizations(res.data || []);
      setCustomizationsError('');
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch customizations:', err);
      setCustomizationsError(err.data?.message || err.message || 'Failed to load customizations.');
      return [];
    } finally {
      setCustomizationsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshAll = useCallback(async () => {
    setUsersLoading(true);
    setOrdersLoading(true);
    setCustomizationsLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchOrders(), fetchCustomizations()]);
      setLastUpdatedAt(new Date().toISOString());
    } finally {
      setUsersLoading(false);
      setOrdersLoading(false);
      setCustomizationsLoading(false);
    }
  }, [fetchUsers, fetchOrders, fetchCustomizations]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUsers([]);
      setOrders([]);
      setCustomizations([]);
      setUsersError('');
      setOrdersError('');
      setCustomizationsError('');
      setLastUpdatedAt(null);
      return undefined;
    }

    refreshAll();

    const intervalId = window.setInterval(() => {
      refreshAll();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, refreshAll]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await ordersAPI.updateStatus(orderId, status);
      const nextStatus = normalizeStatus(res.data?.status || status);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === String(orderId)
            ? {
              ...order,
              status: nextStatus,
              createdAt: res.data?.created_at || order.createdAt,
            }
            : order
        )
      );

      setLastUpdatedAt(new Date().toISOString());
      return { success: true, message: res.message, status: nextStatus };
    } catch (err) {
      console.error('Failed to update order status:', err);
      throw err;
    }
  };

  const deleteUser = async (userId) => {
    try {
      await usersAPI.delete(userId);
      setUsers((prev) => prev.filter((user) => user.id !== String(userId)));
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to delete user:', err);
      throw err;
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await usersAPI.updateRole(userId, role);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === String(userId) ? { ...user, role } : user
        )
      );
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to update user role:', err);
      throw err;
    }
  };


  const updateCustomizationStatus = async (orderId, status) => {
    try {
      const res = await customizationsAPI.updateStatus(orderId, status);
      // Update in our customizations array (and theoretically it updates the main order too)
      setCustomizations((prev) =>
        prev.map((c) =>
          String(c.order_id) === String(orderId) ? { ...c, status: res.data?.status || status } : c
        )
      );
      // Also update the main orders array if it exists
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(orderId) ? { ...o, status: res.data?.status || status } : o
        )
      );
      setLastUpdatedAt(new Date().toISOString());
      return res.data;
    } catch (err) {
      console.error('Failed to update customization status:', err);
      throw err;
    }
  };

  const loading = usersLoading || ordersLoading || customizationsLoading;
  const error = usersError || ordersError || customizationsError;

  const value = {
    users,
    orders,
    customizations,
    loading,
    usersLoading,
    ordersLoading,
    customizationsLoading,
    usersError,
    ordersError,
    customizationsError,
    error,
    lastUpdatedAt,
    updateOrderStatus,
    updateCustomizationStatus,
    deleteUser,
    updateUserRole,
    refreshUsers: fetchUsers,
    refreshOrders: fetchOrders,
    refreshCustomizations: fetchCustomizations,
    refreshAll,
  };

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }

  return context;
};
