import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initializePixel, pageView } from '../analytics/metaPixel';

let pixelBooted = false;

export default function PixelTracker() {
  const location = useLocation();
  const previousPathRef = useRef(null);

  useEffect(() => {
    // Initialize the Meta Pixel SDK once on first mount
    if (!pixelBooted) {
      initializePixel();
      pixelBooted = true;
    }

    // Build a key from pathname + search to detect actual navigations
    const currentKey = `${location.pathname}${location.search}`;

    // Skip if this is the same page (prevents duplicate fires)
    if (previousPathRef.current === currentKey) {
      return;
    }

    previousPathRef.current = currentKey;
    pageView();
  }, [location.pathname, location.search]);

  return null;
}
