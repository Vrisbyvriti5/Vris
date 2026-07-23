import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializePixel, trackPageView } from '../analytics/metaPixel';

let initialized = false;

export default function PixelTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!initialized) {
      initializePixel();
      initialized = true;
    }
    trackPageView();
  }, [location.pathname, location.search]);

  return null;
}
