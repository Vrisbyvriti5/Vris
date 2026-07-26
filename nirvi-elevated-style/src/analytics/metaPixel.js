/**
 * Meta Pixel Tracking Utility
 *
 * All tracking calls are wrapped in try/catch so pixel failures
 * never break UI.  Every event generates a unique `eventID` for
 * future Conversions API (CAPI) deduplication.
 *
 * Currency is always INR.
 */

const CURRENCY = 'INR';

// ─── Initialization ─────────────────────────────────────────

let _initialized = false;

/**
 * Loads the Meta Pixel SDK and initializes it with the Pixel ID
 * from VITE_META_PIXEL_ID.  Safe to call multiple times — only
 * runs once.
 */
export const initializePixel = () => {
  try {
    if (_initialized) return;
    if (typeof window === 'undefined') return;

    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (!pixelId) {
      if (import.meta.env.DEV) {
        console.warn('[Meta Pixel] VITE_META_PIXEL_ID is not set — skipping initialization.');
      }
      return;
    }

    // If fbq already exists (e.g. from a <script> in index.html), just init
    if (typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      _initialized = true;
      debugLog('Initialized (existing fbq)', { pixelId });
      return;
    }

    // Bootstrap the fbq stub exactly as Meta's base code does
    const fbq = function () {
      fbq.callMethod
        ? fbq.callMethod.apply(fbq, arguments)
        : fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;

    // Load the SDK script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onerror = () => {
      if (import.meta.env.DEV) {
        console.warn('[Meta Pixel] Failed to load fbevents.js — ads may be blocked.');
      }
    };

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    // Initialize with the Pixel ID
    window.fbq('init', pixelId);
    _initialized = true;

    debugLog('Initialized', { pixelId });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] Initialization error:', err);
    }
  }
};

// ─── Helpers ────────────────────────────────────────────────

/** Returns true when the Meta Pixel base code is loaded and ready. */
const fbqReady = () => {
  try {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  } catch {
    return false;
  }
};

/** Generates a unique event ID (UUID v4–style) for CAPI deduplication. */
const generateEventId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback below
  }
  // Simple fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/** Dev-only logger — silent in production. */
const debugLog = (eventName, data, eventId) => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[Meta Pixel] ${eventName}`, { ...data, ...(eventId ? { eventID: eventId } : {}) });
    }
  } catch {
    // Silently ignore
  }
};

// ─── Core track wrapper ─────────────────────────────────────

/**
 * Low-level wrapper around `window.fbq('track', ...)`.
 * Always generates an eventID for future CAPI deduplication.
 * Returns the eventID so callers can forward it to the server
 * if/when Conversions API is implemented.
 */
const track = (eventName, data = {}) => {
  const eventId = generateEventId();

  try {
    if (!fbqReady()) {
      debugLog(`${eventName} (skipped – fbq not ready)`, data, eventId);
      return eventId;
    }

    if (Object.keys(data).length > 0) {
      window.fbq('track', eventName, data, { eventID: eventId });
    } else {
      window.fbq('track', eventName, {}, { eventID: eventId });
    }

    debugLog(eventName, data, eventId);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[Meta Pixel] Error tracking ${eventName}:`, err);
    }
  }

  return eventId;
};

// ─── Public event functions ─────────────────────────────────

/**
 * PageView — fired once per route navigation by PixelTracker.
 */
export const pageView = () => {
  return track('PageView');
};

/**
 * ViewContent — fired once when a product page loads.
 *
 * @param {Object} product - Product object from the catalog/API.
 */
export const viewContent = (product) => {
  try {
    if (!product?.id) return null;

    return track('ViewContent', {
      content_ids: [String(product.id)],
      content_name: String(product.name || ''),
      content_category: String(product.category || ''),
      value: Number(product.price || product.final_price || 0),
      currency: CURRENCY,
      content_type: 'product',
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] Error in viewContent:', err);
    }
    return null;
  }
};

/**
 * Search — fired when user submits a search or the search
 * results page loads with a query.  NOT on every keystroke.
 *
 * @param {string} searchTerm - The search query string.
 */
export const search = (searchTerm) => {
  try {
    const term = String(searchTerm || '').trim();
    if (!term) return null;

    return track('Search', {
      search_string: term,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] Error in search:', err);
    }
    return null;
  }
};

/**
 * AddToCart — fired ONLY after the cart API call succeeds.
 *
 * @param {Object} product - Product that was added.
 * @param {number} [quantity=1] - Quantity added.
 */
export const addToCart = (product, quantity = 1) => {
  try {
    if (!product?.id) return null;

    const price = Number(product.price || product.final_price || 0);

    return track('AddToCart', {
      content_ids: [String(product.id)],
      content_name: String(product.name || ''),
      content_type: 'product',
      value: price * quantity,
      currency: CURRENCY,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] Error in addToCart:', err);
    }
    return null;
  }
};

/**
 * AddToWishlist — fired when a user adds (not removes) a
 * product to their wishlist.
 *
 * @param {Object} product - Product that was wishlisted.
 */
export const addToWishlist = (product) => {
  try {
    if (!product?.id) return null;

    return track('AddToWishlist', {
      content_ids: [String(product.id)],
      content_name: String(product.name || ''),
      content_type: 'product',
      value: Number(product.price || product.final_price || 0),
      currency: CURRENCY,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] Error in addToWishlist:', err);
    }
    return null;
  }
};

/**
 * InitiateCheckout — fired when user clicks "Proceed to Checkout"
 * from Cart, OR clicks "Buy Now" on a product page.
 *
 * @param {Object} cart - Object with `items` array and `totalPrice`.
 */
export const initiateCheckout = (cart) => {
  try {
    const items = Array.isArray(cart?.items) ? cart.items : [];
    const numItems = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

    return track('InitiateCheckout', {
      value: Number(cart?.totalPrice || 0),
      currency: CURRENCY,
      num_items: numItems,
      content_ids: items.map((item) => String(item.product_id || item.id || '')),
      content_type: 'product',
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] Error in initiateCheckout:', err);
    }
    return null;
  }
};

/**
 * Purchase — fired ONLY after:
 *   1. Razorpay payment verification succeeds, AND
 *   2. Order is successfully saved to MySQL.
 *
 * NEVER fires on page load.
 *
 * @param {Object} order - The saved order object.
 */
export const purchase = (order) => {
  try {
    if (!order?.id) return null;

    const items = Array.isArray(order.items) ? order.items : [];
    const numItems = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

    return track('Purchase', {
      transaction_id: String(order.id),
      value: Number(order.totals?.total || order.total || 0),
      currency: CURRENCY,
      content_type: 'product',
      num_items: numItems,
      contents: items.map((item) => ({
        id: String(item.product_id || item.id || ''),
        name: String(item.name || ''),
        quantity: Number(item.quantity || 1),
        item_price: Number(item.price || 0),
      })),
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] Error in purchase:', err);
    }
    return null;
  }
};
