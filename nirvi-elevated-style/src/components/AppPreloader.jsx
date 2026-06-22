import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ─── Critical images to preload before revealing the site ───────────────
   We preload the first 2 hero slides + first secondary slide so the above-
   fold experience is pixel-perfect on reveal.  Everything else lazy-loads
   after the site is visible.                                              */
const CRITICAL_IMAGES = [
  // Hero slider — first 2 slides
  'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038691292-49467ab07788-First.webp',
  'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038691204-60363ba52cb1-Second.webp',
  // Secondary slider — first slide
  'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038690810-4e556c0cc880-fourth2.webp',
];

/** Minimum time the loader stays visible so the animation feels intentional */
const MIN_DISPLAY_MS = 0;

/** Maximum time to wait for assets before force-revealing (safety net) */
const MAX_WAIT_MS = 3000;

/* ─── Preload a single image and return a promise ─────────────────────── */
const preloadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve; // never block on a failed image
    img.src = src;
    if (img.complete) resolve();
  });

/**
 * AppPreloader
 *
 * Full-screen overlay with the animated VRIS "V" that stays visible until:
 *  1. Critical hero images have been fetched & decoded
 *  2. Document fonts are ready
 *  3. A minimum display time has elapsed (so the animation reads properly)
 *
 * After all conditions are met the overlay fades out smoothly and unmounts,
 * revealing the fully-loaded website underneath.
 */
const AppPreloader = ({ children }) => {
  const [phase, setPhase] = useState('loading');   // 'loading' | 'fading' | 'done'
  const startTimeRef = useRef(Date.now());

  const reveal = useCallback(() => {
    // Ensure the loader was visible for at least MIN_DISPLAY_MS
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    setTimeout(() => {
      // Begin CSS fade-out
      setPhase('fading');
      // After the fade animation completes, unmount overlay entirely
      setTimeout(() => setPhase('done'), 600);
    }, remaining);
  }, []);

  useEffect(() => {
    // Remove the static HTML loader from index.html (if still present)
    const htmlLoader = document.getElementById('vris-initial-loader');
    if (htmlLoader) htmlLoader.remove();

    let cancelled = false;

    const loadAssets = async () => {
      try {
        await Promise.all([
          // Wait for ALL critical images
          ...CRITICAL_IMAGES.map(preloadImage),
          // Wait for fonts (Playfair Display, body fonts, etc.)
          document.fonts?.ready || Promise.resolve(),
        ]);
      } catch {
        // If anything throws, still reveal — never block the user
      }
      if (!cancelled) reveal();
    };

    loadAssets();

    // Safety timeout — ALWAYS reveal even if images are extremely slow
    const safetyTimer = setTimeout(() => {
      if (!cancelled) reveal();
    }, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [reveal]);

  return (
    <>
      {/* ── Website content (rendered immediately, hidden behind overlay) ── */}
      <div
        style={{
          visibility: phase === 'loading' ? 'hidden' : 'visible',
          opacity: phase === 'done' ? 1 : 1,
        }}
      >
        {children}
      </div>

      {/* ── Loader overlay ──────────────────────────────────────────────── */}
      {phase !== 'done' && (
        <>
          <style>{`
            @keyframes ap-spin {
              0%   { transform: perspective(600px) rotateY(0deg); }
              100% { transform: perspective(600px) rotateY(360deg); }
            }
            @keyframes ap-glow {
              0%, 100% {
                text-shadow:
                  0 0 8px  rgba(224,176,144,0.45),
                  0 0 20px rgba(224,176,144,0.25),
                  0 0 40px rgba(224,176,144,0.10);
                opacity: 1;
              }
              50% {
                text-shadow:
                  0 0 14px rgba(224,176,144,0.65),
                  0 0 32px rgba(224,176,144,0.40),
                  0 0 60px rgba(224,176,144,0.18);
                opacity: 0.92;
              }
            }
            @keyframes ap-fade-in {
              from { opacity: 0; transform: scale(0.92); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>

          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: phase === 'fading' ? 0 : 1,
              pointerEvents: phase === 'fading' ? 'none' : 'auto',
            }}
            role="status"
            aria-label="Loading VRIS"
          >
            <span
              style={{
                fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
                fontSize: '42px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#e0b090',
                lineHeight: 1,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                background: 'linear-gradient(165deg, #e0b090 0%, #ebd1c1 38%, #e0b090 52%, #d6a382 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'ap-spin 1.2s cubic-bezier(0.45,0.05,0.55,0.95) infinite, ap-glow 2.4s ease-in-out infinite, ap-fade-in 0.6s ease-out both',
                filter: 'drop-shadow(0 1px 3px rgba(224,176,144,0.20))',
                willChange: 'transform, opacity',
              }}
              aria-hidden="true"
            >
              V
            </span>
          </div>
        </>
      )}
    </>
  );
};

export default AppPreloader;
