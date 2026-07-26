import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { pageView } from '../analytics/metaPixel';

export default function PixelTracker() {
  const location = useLocation();
  const previousPathRef = useRef(null);

  useEffect(() => {
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
