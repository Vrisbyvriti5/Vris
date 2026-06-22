import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ─── Slide images (4 slides — replace URLs when ready) ────────────────────
   Width: 2075px, Height: 758px                                             */
const SLIDES = [
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777759225367-2cab55ad9427-2slider(2).webp',
    alt: 'VRIS Featured — Slide 1',
    to: '/shop',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777759225310-31efc1f4cc1a-2slider(3).webp',
    alt: 'VRIS Featured — Slide 2',
    to: '/contact',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777759225339-3acc98036345-2slider(1).webp',
    alt: 'VRIS Featured — Slide 3',
    to: '/shop?cat=shoes',
  },
  {
    src: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777759225253-7c87a888a4c3-2slider(4).webp',
    alt: 'VRIS Featured — Slide 4',
    to: 'https://www.instagram.com/project.vris?igsh=MWNsbmcxd2Qxanl0Mw==',
    external: true,
  },
];

const SLIDE_COUNT = SLIDES.length;
const SLIDE_DURATION = 5000; // 5 seconds
const TRANSITION_MS = 600;

/*
  Infinite-loop clone technique:
  Track = [clone-last, ...originals, clone-first]
*/

const SecondarySlider = () => {
  const [trackIndex, setTrackIndex] = useState(1);
  const [enableTransition, setEnableTransition] = useState(true);
  const [timerVersion, setTimerVersion] = useState(0);
  const timerRef = useRef(null);
  const isLockedRef = useRef(false);

  const visualIndex = ((trackIndex - 1) % SLIDE_COUNT + SLIDE_COUNT) % SLIDE_COUNT;

  const trackSlides = [
    SLIDES[SLIDE_COUNT - 1],
    ...SLIDES,
    SLIDES[0],
  ];
  const trackLength = trackSlides.length;

  // ── Teleport after reaching a clone ───────────────────────────────────
  const handleTransitionEnd = useCallback(() => {
    if (trackIndex === SLIDE_COUNT + 1) {
      setEnableTransition(false);
      setTrackIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
          isLockedRef.current = false;
        });
      });
    } else if (trackIndex === 0) {
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

  // ── Go to a specific visual slide ─────────────────────────────────────
  const goToVisual = useCallback((visIdx) => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setEnableTransition(true);
    setTrackIndex(visIdx + 1);
    setTimerVersion((v) => v + 1);
  }, []);

  // ── Next / Prev ───────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setEnableTransition(true);
    setTrackIndex((prev) => prev + 1);
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
    setTimerVersion((v) => v + 1);
  }, []);

  // ── Auto-advance ──────────────────────────────────────────────────────
  const advanceSlide = useCallback(() => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    setEnableTransition(true);
    setTrackIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(advanceSlide, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advanceSlide, timerVersion]);

  // ── Cleanup ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchDeltaXRef = useRef(0);
  const SWIPE_THRESHOLD = 25;

  const pauseAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeAutoPlay = useCallback(() => {
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
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    } else {
      resumeAutoPlay();
    }
  };

  const translatePercent = (-(trackIndex * 100) + dragOffset) / trackLength;

  return (
    <div className="mt-8 w-full">
      {/* ── Slider Container ─────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        ref={containerRef}
        style={{
          aspectRatio: '2075 / 758',
          maxHeight: '758px',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resumeAutoPlay}
      >
        {/* Slide Track */}
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
          {trackSlides.map((slide, idx) => {
            const content = (
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover object-center transition-transform duration-1000 ease-in-out hover:scale-[1.02]"
                loading={idx <= 1 ? 'eager' : 'lazy'}
                draggable={false}
              />
            );

            const className = "relative block h-full shrink-0 overflow-hidden";
            const style = { width: `${100 / trackLength}%` };

            return slide.external ? (
              <a
                key={idx}
                href={slide.to || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                style={style}
              >
                {content}
              </a>
            ) : (
              <Link
                key={idx}
                to={slide.to || '/shop'}
                className={className}
                style={style}
              >
                {content}
              </Link>
            );
          })}
        </div>

        {/* ── Navigation Arrows ────────────────────────────────────────── */}
        <button
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>

        {/* ── Pagination Dots (bottom of image) ────────────────────────── */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToVisual(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="transition-all duration-200 rounded-full focus:outline-none"
              style={{
                width: idx === visualIndex ? '10px' : '7px',
                height: idx === visualIndex ? '10px' : '7px',
                backgroundColor: idx === visualIndex ? '#000' : '#d1d5db',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecondarySlider;
