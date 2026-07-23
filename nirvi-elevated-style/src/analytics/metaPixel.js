export const META_EVENTS = {
  PAGE_VIEW: "PageView",
  VIEW_CONTENT: "ViewContent",
  ADD_TO_CART: "AddToCart",
  INITIATE_CHECKOUT: "InitiateCheckout",
  PURCHASE: "Purchase",
};

const isInitialized = () => typeof window.fbq === "function";

export const initializePixel = () => {
  if (isInitialized()) return; // Prevent double initialization

  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!pixelId) return;

  // Initialize the fbq function
  window.fbq = function() {
    window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
  };
  if (!window._fbq) window._fbq = window.fbq;
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = [];

  // Load the script cleanly
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  
  script.onload = () => {
    if (import.meta.env.DEV) {
      console.log("Meta Pixel script loaded");
    }
  };

  script.onerror = () => {
    console.error("Failed to load Meta Pixel script");
  };

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
  
  window.fbq('init', pixelId);

  if (import.meta.env.DEV) {
    console.log("Meta Pixel initialized");
  }
};

/**
 * Generic track wrapper
 */
export const track = (eventName, data = {}, eventId = null) => {
  if (!isInitialized()) return;
  
  const options = eventId ? { eventID: eventId } : undefined;
  
  if (options) {
    window.fbq('track', eventName, data, options);
  } else if (Object.keys(data).length > 0) {
    window.fbq('track', eventName, data);
  } else {
    window.fbq('track', eventName);
  }
};

export const trackPageView = () => {
  track(META_EVENTS.PAGE_VIEW);
};

// Example payload: { content_ids: ["SKU123"], content_type: "product", value: 1299, currency: "INR" }
export const trackViewContent = (data, eventId) => {
  if (!data?.content_ids || !data?.value || !data?.currency) {
    console.warn("Invalid ViewContent payload: missing required fields");
    return;
  }
  track(META_EVENTS.VIEW_CONTENT, data, eventId);
};

// Example payload: { content_ids: ["SKU123"], content_name: "Dress", value: 1299, currency: "INR" }
export const trackAddToCart = (data, eventId) => {
  if (!data?.content_ids || !data?.value || !data?.currency) {
    console.warn("Invalid AddToCart payload: missing required fields");
    return;
  }
  track(META_EVENTS.ADD_TO_CART, data, eventId);
};

// Example payload: { value: 1299, currency: "INR" }
export const trackInitiateCheckout = (data, eventId) => {
  if (!data?.value || !data?.currency) {
    console.warn("Invalid InitiateCheckout payload: missing value or currency");
    return;
  }
  track(META_EVENTS.INITIATE_CHECKOUT, data, eventId);
};

// Example payload: { value: 1299, currency: "INR", content_ids: ["SKU123"], content_type: "product", num_items: 1 }
export const trackPurchase = (data, eventId) => {
  if (!data?.value || !data?.currency) {
    console.warn("Invalid Purchase payload: missing value or currency");
    return;
  }
  track(META_EVENTS.PURCHASE, data, eventId);
};
