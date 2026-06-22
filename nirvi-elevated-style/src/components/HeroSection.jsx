import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ─── Slide images (6 slides) ───────────────────────────────────────────────
   Width: 2075px, Height: 758px — user will replace URLs later              */
const HERO_SLIDES = [
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534193-3e94c8879e3d-SLIDERS(2).webp',
    alt: 'VRIS Collection — Slide 1',
    to: '/shop?cat=totebags',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534263-bea65f716a00-SLIDERS(3).webp',
    alt: 'VRIS Collection — Slide 2',
    to: '/shop?collection=Denim',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534334-7358ddebbcf8-SLIDERS(6).webp',
    alt: 'VRIS Collection — Slide 3',
    to: '/shop',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534309-49251ffe9272-SLIDERS(5).webp',
    alt: 'VRIS Collection — Slide 4',
    to: '/shop?collection=Wool',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534286-7abafe48f1cc-SLIDERS(4).webp',
    alt: 'VRIS Collection — Slide 5',
    to: '/shop?cat=laptop%20sleeves',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534383-2cc33149fa6a-SLIDERS(1).webp',
    alt: 'VRIS Collection — Slide 6',
    to: '/shop?sort=bestseller',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758534362-98b2abe07ccf-SLIDERS(7).webp',
    alt: 'VRIS Collection — Slide 7',
    to: '/shop?sort=newest',
  },
];

const SLIDE_COUNT = HERO_SLIDES.length;
const SLIDE_DURATION = 3000; // 3 seconds per slide
const TRANSITION_MS = 600; // slide animation duration in ms
const SWIPE_THRESHOLD = 25;

/*
  Infinite-loop strategy:
  Track layout = [clone-last, ...original slides, clone-first]
  Total track items = SLIDE_COUNT + 2
  Visual index 0 => track index 1 (first real slide)
  Visual index N-1 => track index N (last real slide)
  When landing on clone-first (track N+1), instantly teleport to track 1.
  When landing on clone-last (track 0), instantly teleport to track N.
*/

const HeroSection = () => {
  const prefersReducedMotion = useReducedMotion();
  // trackIndex: 1..SLIDE_COUNT = real slides, 0 = clone of last, SLIDE_COUNT+1 = clone of first
  const [trackIndex, setTrackIndex] = useState(1);
  const [enableTransition, setEnableTransition] = useState(true);
  const [progressKey, setProgressKey] = useState(0);
  const [timerVersion, setTimerVersion] = useState(0); // bumped to restart auto-play
  const [isInteracting, setIsInteracting] = useState(false);
  const timerRef = useRef(null);
  const isLockedRef = useRef(false);
  const touchStartXRef = useRef(null);
  const touchDeltaXRef = useRef(0);

  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);

  // The visual slide index (0-based, 0..SLIDE_COUNT-1)
  const visualIndex = ((trackIndex - 1) % SLIDE_COUNT + SLIDE_COUNT) % SLIDE_COUNT;

  // Build track: [clone-last, ...originals, clone-first]
  const trackSlides = useMemo(
    () => [
      HERO_SLIDES[SLIDE_COUNT - 1], // clone of last
      ...HERO_SLIDES,
      HERO_SLIDES[0], // clone of first
    ],
    [],
  );
  const trackLength = trackSlides.length; // SLIDE_COUNT + 2

  // ── Teleport handler (snap without animation after reaching a clone) ──
  const handleTransitionEnd = useCallback(() => {
    if (trackIndex === SLIDE_COUNT + 1) {
      // Landed on clone-first → teleport to real first
      setEnableTransition(false);
      setTrackIndex(1);
      // Re-enable transition next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
          isLockedRef.current = false;
        });
      });
    } else if (trackIndex === 0) {
      // Landed on clone-last → teleport to real last
      setEnableTransition(false);
      setTrackIndex(SLIDE_COUNT);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
          isLockedRef.current = false;
        });
      });
    } else {
      isLockedRef.current = false;
    }
  }, [trackIndex]);

  // ── Go to a visual slide by its 0-based index ─────────────────────────
  const goToVisual = useCallback((visIdx) => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    // Clear existing auto-timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setEnableTransition(true);
    setTrackIndex(visIdx + 1); // +1 because track[0] is the clone
    setProgressKey((k) => k + 1);
    // Bump timerVersion so the auto-play useEffect re-runs and creates a fresh interval
    setTimerVersion((v) => v + 1);
  }, []);

  const goNext = useCallback(() => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setEnableTransition(true);
    setTrackIndex((prev) => prev + 1);
    setProgressKey((k) => k + 1);
    setTimerVersion((v) => v + 1);
  }, []);

  const goPrev = useCallback(() => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setEnableTransition(true);
    setTrackIndex((prev) => prev - 1);
    setProgressKey((k) => k + 1);
    setTimerVersion((v) => v + 1);
  }, []);

  // ── Auto-advance (next slide) ─────────────────────────────────────────
  const advanceSlide = useCallback(() => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    setEnableTransition(true);
    setTrackIndex((prev) => prev + 1);
    setProgressKey((k) => k + 1);
  }, []);

  // ── Auto-play timer (re-runs whenever timerVersion bumps) ─────────────
  useEffect(() => {
    if (prefersReducedMotion || isInteracting) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      advanceSlide();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advanceSlide, timerVersion, prefersReducedMotion, isInteracting]);

  // ── Cleanup ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Bar click ─────────────────────────────────────────────────────────
  const handleBarClick = (visIdx) => {
    if (visIdx === visualIndex) return;
    goToVisual(visIdx);
  };

  // ── Compute transform ─────────────────────────────────────────────────
  const translatePercent = (-(trackIndex * 100) + dragOffset) / trackLength;

  const pauseAutoPlay = useCallback(() => {
    setIsInteracting(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeAutoPlay = useCallback(() => {
    setIsInteracting(false);
    setProgressKey((k) => k + 1);
    setTimerVersion((v) => v + 1);
  }, []);

  const handleTouchStart = (event) => {
    if (!event.touches?.length) return;
    touchStartXRef.current = event.touches[0].clientX;
    touchDeltaXRef.current = 0;
    setEnableTransition(false);
    pauseAutoPlay();
  };

  const handleTouchMove = (event) => {
    if (!event.touches?.length || touchStartXRef.current == null || !containerRef.current) return;
    const deltaX = event.touches[0].clientX - touchStartXRef.current;
    touchDeltaXRef.current = deltaX;
    
    // Convert pixel delta to percentage of one slide
    const containerWidth = containerRef.current.offsetWidth;
    const offsetPercent = (deltaX / containerWidth) * 100;
    setDragOffset(offsetPercent);
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaXRef.current;
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setDragOffset(0);
    setEnableTransition(true);

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      setIsInteracting(false);
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
      return;
    }

    resumeAutoPlay();
  };

  return (
    <div id="hero-slider-wrapper" className="mt-[100px] md:mt-16">
      {/* ── Image Slider ──────────────────────────────────────────────── */}
      <section
        id="hero-slider"
        ref={containerRef}
        className="relative w-full overflow-hidden bg-zinc-100"
        style={{
          aspectRatio: '2075 / 758',
          maxHeight: 'min(70vh, 758px)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resumeAutoPlay}
      >
        <div
          className="flex h-full"
          style={{
            width: `${trackLength * 100}%`,
            transform: `translateX(${translatePercent}%)`,
            transition: enableTransition
              ? `transform ${TRANSITION_MS}ms cubic-bezier(0.42, 0, 0.28, 1)`
              : 'none',
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackSlides.map((slide, idx) => (
            <Link
              key={idx}
              to={slide.to || '/shop'}
              className="relative block h-full shrink-0 overflow-hidden"
              style={{ width: `${100 / trackLength}%` }}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out motion-reduce:transition-none md:hover:scale-[1.02]"
                loading={idx <= 1 ? 'eager' : 'lazy'}
                fetchPriority={idx <= 1 ? 'high' : undefined}
                width={2075}
                height={758}
                sizes="100vw"
                decoding="async"
                draggable={false}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Progress Bar Indicators (below slider) ────────────────────── */}
      <div className="mt-3 flex w-full items-center justify-center gap-4 px-3 md:mt-4 md:gap-4 md:px-0">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleBarClick(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className="group relative cursor-pointer overflow-hidden rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            style={{
              width: 'clamp(38px, 9vw, 60px)',
              height: '4px',
              backgroundColor: '#e5e5e5',
            }}
          >
            {/* Active slide — animated fill left→right */}
            {idx === visualIndex && (
              <motion.span
                key={`progress-${idx}-${progressKey}`}
                className="absolute left-0 top-0 h-full rounded-full bg-foreground/80"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: prefersReducedMotion ? 0 : SLIDE_DURATION / 1000,
                  ease: 'linear',
                }}
              />
            )}

            {/* Past slides — fully filled */}
            {idx < visualIndex && (
              <span className="absolute left-0 top-0 h-full w-full rounded-full bg-foreground/50" />
            )}

            {/* Hover highlight */}
            <span className="absolute inset-0 rounded-full bg-foreground/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </button>
        ))}
      </div>


    </div>
  );
};

export default HeroSection;
