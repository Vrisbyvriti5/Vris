/**
 * VRIS — Centralised API Client
 *
 * All backend fetch calls go through this module so that base URL,
 * authentication headers and error handling are in one place.
 */

const envApiBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const rawApiBase = (() => {
  if (!envApiBase) {
    return '/api';
  }

  // Prevent mixed-content failures if a stale http:// base is configured in prod.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && /^http:\/\//i.test(envApiBase)) {
    return '/api';
  }

  return envApiBase;
})();
const API_BASE = rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`;

// ── Token persistence ────────────────────────────────────────────────────────
const TOKEN_KEY = 'vris-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// ── Core fetch wrapper ───────────────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { ...options.headers };

  // Don't set Content-Type for FormData (let the browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    const networkError = new Error('Unable to reach server. Please check your internet or backend connection.');
    networkError.status = 0;
    throw networkError;
  }

  const data = await res.json().catch(() => ({ success: false, message: 'Invalid response' }));

  if (!res.ok) {
    const fallbackMessageByStatus = {
      413: 'File too large. Maximum size is 20 MB.',
      502: 'Server gateway error. Please try again in a few moments.',
      504: 'Server timed out while processing your request. Please try a smaller image or retry.',
    };

    const error = new Error(
      data.message
        || fallbackMessageByStatus[res.status]
        || `Request failed with status ${res.status}`,
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password, phone) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email: String(email || '').trim().toLowerCase(),
        password,
        ...(String(phone || '').trim() ? { phone: String(phone || '').trim() } : {}),
      }),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: String(email || '').trim().toLowerCase(), password }),
    }),

  sendOtp: (email) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: String(email || '').trim().toLowerCase() }),
    }),

  verifyOtp: (email, otp) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: String(email || '').trim().toLowerCase(), otp: String(otp || '').trim() }),
    }),

  resetPassword: (email, password, confirmPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: String(email || '').trim().toLowerCase(),
        password,
        confirmPassword,
      }),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getProfile: () => request('/auth/profile'),
  updateProfile: (payload) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  uploadAvatar: (formData) =>
    request('/auth/avatar', {
      method: 'POST',
      body: formData,
    }),

  deleteAvatar: () =>
    request('/auth/avatar', {
      method: 'DELETE',
    }),

  changePassword: (payload) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  sendMobileOtp: () =>
    request('/auth/mobile/send-otp', {
      method: 'POST',
    }),

  verifyMobileOtp: (otp) =>
    request('/auth/mobile/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp: String(otp || '').trim() }),
    }),
};

// ── Products API ─────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'All') searchParams.set('category', params.category);
    if (params.collection && params.collection !== 'All') searchParams.set('collection', params.collection);
    if (params.search) searchParams.set('search', params.search);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params._ts) searchParams.set('_ts', String(params._ts));
    const qs = searchParams.toString();
    return request(`/products${qs ? `?${qs}` : ''}`, {
      cache: 'no-store',
    });
  },

  getById: (id) => request(`/products/${id}`, {
    cache: 'no-store',
  }),

  getCategories: () => request('/products/categories', {
    cache: 'no-store',
  }),

  create: (formData) =>
    request('/products', {
      method: 'POST',
      body: formData, // FormData for multipart
    }),

  update: (id, formData) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: formData,
    }),

  delete: (id) =>
    request(`/products/${id}`, { method: 'DELETE' }),

  getReviews: (id) => request(`/products/${id}/reviews`, {
    cache: 'no-store',
  }),

  addReview: (id, rating, comment) =>
    request(`/products/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),

  updateReview: (productId, reviewId, rating, comment) =>
    request(`/products/${productId}/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment }),
    }),

  deleteReview: (productId, reviewId) =>
    request(`/products/${productId}/reviews/${reviewId}`, { method: 'DELETE' }),
};

// ── Coupons API ──────────────────────────────────────────────────────────────
export const couponsAPI = {
  apply: (code, orderAmount) =>
    request('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code: String(code || '').trim(), orderAmount }),
    }),
};

// ── Cart API ─────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => request('/cart'),

  addItem: (productId, quantity = 1) =>
    request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  updateQuantity: (productId, quantity) =>
    request(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (productId) =>
    request(`/cart/${productId}`, { method: 'DELETE' }),

  clear: () =>
    request('/cart/clear', { method: 'DELETE' }),
};

// ── Orders API ───────────────────────────────────────────────────────────────
export const ordersAPI = {
  place: (orderData) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  createRazorpayOrder: (amount) =>
    request('/orders/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  verifyRazorpayPayment: (payload) =>
    request('/orders/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => request('/orders/my-orders'),

  getById: (id) => request(`/orders/${id}`),

  // Admin
  getAll: () => request('/orders/all'),

  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// ── Users API (admin) ────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => request('/users'),

  getById: (id) => request(`/users/${id}`),

  delete: (id) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  updateRole: (id, role) =>
    request(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};

// ── Contact API ─────────────────────────────────────────────────────────────
export const contactAPI = {
  createMessage: (payload) =>
    request('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMessages: () => request('/contact/messages'),
};

// ── Newsletter API ─────────────────────────────────────────────────────────
export const newsletterAPI = {
  subscribe: (email) =>
    request('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: String(email || '').trim().toLowerCase() }),
    }),

  getSubscribers: () => request('/newsletter/subscribers'),
};

// ── Contact Requests API ───────────────────────────────────────────────────
export const contactRequestsAPI = {
  create: (payload) =>
    request('/contact-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAll: () => request('/contact-requests'),

  updateStatus: (id, status) =>
    request(`/contact-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ── Plus Membership API ───────────────────────────────────────────────────
export const plusAPI = {
  createSubscription: () =>
    request('/plus/create-subscription', {
      method: 'POST',
    }),

  verifySubscription: (payload) =>
    request('/plus/verify-subscription', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
