import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TOTAL_FRAMES = 200;
const FRAME_STEP = 2;
const LOADED_COUNT = Math.ceil(TOTAL_FRAMES / FRAME_STEP);
const INITIAL_BATCH_SIZE = 8;
const BACKGROUND_BATCH_SIZE = 8;
const FRAME_PATH = '/Hero_Section_Animation/ezgif-frame-';
const PLACEHOLDER_SRC = `${FRAME_PATH}001.jpg`;
const HERO_HEIGHT = '300vh';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const frameSrc = (index) =>
  `${FRAME_PATH}${String(index).padStart(3, '0')}.jpg`;

const getBatchStart = (frameIndex) =>
  Math.floor(clamp(frameIndex, 0, LOADED_COUNT - 1) / BACKGROUND_BATCH_SIZE) * BACKGROUND_BATCH_SIZE;

const scheduleIdleWork = (callback, delay = 120) => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (typeof window.requestIdleCallback === 'function') {
    return {
      kind: 'idle',
      id: window.requestIdleCallback(callback, { timeout: 400 }),
    };
  }

  return {
    kind: 'timeout',
    id: window.setTimeout(() => {
      callback({
        didTimeout: true,
        timeRemaining: () => 0,
      });
    }, delay),
  };
};

const cancelIdleWork = (handle) => {
  if (!handle || typeof window === 'undefined') {
    return;
  }

  if (handle.kind === 'idle' && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle.id);
    return;
  }

  window.clearTimeout(handle.id);
};

const HeroCanvas = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(-1);
  const targetFrameRef = useRef(0);
  const animatedFrameRef = useRef(0);
  const requestedFrameRef = useRef(0);
  const rafRef = useRef(null);
  const idleHandleRef = useRef(null);
  const isCancelledRef = useRef(false);
  const hasStartedLoadingRef = useRef(false);
  const initialBatchReadyRef = useRef(false);
  const loadedCountRef = useRef(0);
  const initialLoadedCountRef = useRef(0);
  const queuedBatchStartsRef = useRef(new Set());
  const priorityBatchQueueRef = useRef([]);
  const sequentialBatchStartRef = useRef(INITIAL_BATCH_SIZE);
  const isProcessingBatchRef = useRef(false);
  const pendingImagesRef = useRef(new Map());
  const queuePriorityBatchRef = useRef(() => {});

  const [loadProgress, setLoadProgress] = useState(0);
  const [isInitialBatchReady, setIsInitialBatchReady] = useState(false);

  const getContext = useCallback(() => {
    if (contextRef.current) {
      return contextRef.current;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    contextRef.current = canvas.getContext('2d', { alpha: false }) ?? canvas.getContext('2d');

    if (contextRef.current) {
      contextRef.current.imageSmoothingEnabled = true;
    }

    return contextRef.current;
  }, []);

  const findNearestLoadedFrame = useCallback((frameIndex) => {
    const images = imagesRef.current;

    if (images[frameIndex]?.naturalWidth) {
      return frameIndex;
    }

    for (let offset = 1; offset < LOADED_COUNT; offset += 1) {
      const previousIndex = frameIndex - offset;
      if (previousIndex >= 0 && images[previousIndex]?.naturalWidth) {
        return previousIndex;
      }

      const nextIndex = frameIndex + offset;
      if (nextIndex < LOADED_COUNT && images[nextIndex]?.naturalWidth) {
        return nextIndex;
      }
    }

    return -1;
  }, []);

  const drawFrame = useCallback((preferredFrame, force = false) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) {
      return -1;
    }

    const frameIndex = findNearestLoadedFrame(clamp(preferredFrame, 0, LOADED_COUNT - 1));
    if (frameIndex < 0) {
      return -1;
    }

    if (!force && currentFrameRef.current === frameIndex) {
      return frameIndex;
    }

    const img = imagesRef.current[frameIndex];
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      return -1;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

    currentFrameRef.current = frameIndex;
    return frameIndex;
  }, [findNearestLoadedFrame, getContext]);

  const syncProgressState = useCallback(() => {
    const progress = Math.round((loadedCountRef.current / LOADED_COUNT) * 100);
    setLoadProgress((previousProgress) =>
      previousProgress === progress ? previousProgress : progress,
    );
  }, []);

  const syncWarmState = useCallback(() => {
    if (!initialBatchReadyRef.current && initialLoadedCountRef.current >= INITIAL_BATCH_SIZE) {
      initialBatchReadyRef.current = true;
      currentFrameRef.current = -1;
      targetFrameRef.current = 0;
      animatedFrameRef.current = 0;
      requestedFrameRef.current = 0;
      setIsInitialBatchReady(true);
      drawFrame(0, true);
      return;
    }

    if (initialBatchReadyRef.current) {
      drawFrame(requestedFrameRef.current);
    }
  }, [drawFrame]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (initialBatchReadyRef.current) {
      drawFrame(requestedFrameRef.current, true);
    }
  }, [drawFrame]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    isCancelledRef.current = false;
    hasStartedLoadingRef.current = false;
    initialBatchReadyRef.current = false;
    loadedCountRef.current = 0;
    initialLoadedCountRef.current = 0;
    currentFrameRef.current = -1;
    targetFrameRef.current = 0;
    animatedFrameRef.current = 0;
    requestedFrameRef.current = 0;
    imagesRef.current = new Array(LOADED_COUNT).fill(null);
    pendingImagesRef.current.clear();
    queuedBatchStartsRef.current.clear();
    priorityBatchQueueRef.current = [];
    sequentialBatchStartRef.current = INITIAL_BATCH_SIZE;
    isProcessingBatchRef.current = false;
    setLoadProgress(0);
    setIsInitialBatchReady(false);

    let observer = null;

    const batchHasPendingFrames = (start) => {
      const end = Math.min(start + BACKGROUND_BATCH_SIZE, LOADED_COUNT);

      for (let index = start; index < end; index += 1) {
        if (!imagesRef.current[index]) {
          return true;
        }
      }

      return false;
    };

    const loadFrameImage = (slot) => {
      if (slot < 0 || slot >= LOADED_COUNT) {
        return Promise.resolve(null);
      }

      if (imagesRef.current[slot]) {
        return Promise.resolve(imagesRef.current[slot]);
      }

      const existingPromise = pendingImagesRef.current.get(slot);
      if (existingPromise) {
        return existingPromise.promise;
      }

      let image = null;

      const promise = new Promise((resolve) => {
        image = new Image();
        let settled = false;

        const finish = () => {
          if (settled) {
            return;
          }

          settled = true;
          image.onload = null;
          image.onerror = null;
          pendingImagesRef.current.delete(slot);

          if (isCancelledRef.current) {
            resolve(null);
            return;
          }

          if (!imagesRef.current[slot]) {
            imagesRef.current[slot] = image;
            loadedCountRef.current += 1;

            if (slot < INITIAL_BATCH_SIZE) {
              initialLoadedCountRef.current += 1;
            }
          }

          resolve(image);
        };

        image.decoding = 'async';
        image.onload = () => {
          if (typeof image.decode === 'function') {
            image.decode().catch(() => null).finally(finish);
            return;
          }

          finish();
        };
        image.onerror = finish;
        image.src = frameSrc(slot * FRAME_STEP + 1);

        if (image.complete) {
          window.setTimeout(finish, 0);
        }
      });

      pendingImagesRef.current.set(slot, { image, promise });

      return promise;
    };

    const loadFrameBatch = async (start) => {
      const batchStart = Math.max(0, start);
      const batchEnd = Math.min(batchStart + BACKGROUND_BATCH_SIZE, LOADED_COUNT);
      const slots = [];

      for (let index = batchStart; index < batchEnd; index += 1) {
        if (!imagesRef.current[index]) {
          slots.push(index);
        }
      }

      if (!slots.length) {
        syncProgressState();
        syncWarmState();
        return;
      }

      await Promise.all(slots.map(loadFrameImage));

      if (isCancelledRef.current) {
        return;
      }

      syncProgressState();
      syncWarmState();
    };

    const getNextBatchStart = () => {
      while (priorityBatchQueueRef.current.length) {
        const start = priorityBatchQueueRef.current.shift();
        queuedBatchStartsRef.current.delete(start);

        if (batchHasPendingFrames(start)) {
          return start;
        }
      }

      while (sequentialBatchStartRef.current < LOADED_COUNT) {
        const start = sequentialBatchStartRef.current;
        sequentialBatchStartRef.current += BACKGROUND_BATCH_SIZE;

        if (batchHasPendingFrames(start)) {
          return start;
        }
      }

      return null;
    };

    const runBatchPump = async () => {
      if (isCancelledRef.current || isProcessingBatchRef.current) {
        return;
      }

      const nextBatchStart = getNextBatchStart();
      if (nextBatchStart == null) {
        return;
      }

      isProcessingBatchRef.current = true;
      await loadFrameBatch(nextBatchStart);
      isProcessingBatchRef.current = false;

      if (!isCancelledRef.current) {
        scheduleBatchPump();
      }
    };

    const scheduleBatchPump = () => {
      if (isCancelledRef.current || idleHandleRef.current || isProcessingBatchRef.current) {
        return;
      }

      idleHandleRef.current = scheduleIdleWork(() => {
        idleHandleRef.current = null;
        void runBatchPump();
      });
    };

    const queueBatch = (start, prioritize = false) => {
      const normalizedStart = getBatchStart(start);

      if (normalizedStart < INITIAL_BATCH_SIZE || normalizedStart >= LOADED_COUNT) {
        return;
      }

      if (!batchHasPendingFrames(normalizedStart)) {
        return;
      }

      if (queuedBatchStartsRef.current.has(normalizedStart)) {
        if (prioritize) {
          priorityBatchQueueRef.current = [
            normalizedStart,
            ...priorityBatchQueueRef.current.filter((batchStart) => batchStart !== normalizedStart),
          ];
        }

        scheduleBatchPump();
        return;
      }

      queuedBatchStartsRef.current.add(normalizedStart);

      if (prioritize) {
        priorityBatchQueueRef.current.unshift(normalizedStart);
      } else {
        priorityBatchQueueRef.current.push(normalizedStart);
      }

      scheduleBatchPump();
    };

    queuePriorityBatchRef.current = (frameIndex) => {
      queueBatch(frameIndex, true);
    };

    const startProgressiveLoading = () => {
      if (hasStartedLoadingRef.current || isCancelledRef.current) {
        return;
      }

      hasStartedLoadingRef.current = true;

      void loadFrameBatch(0).then(() => {
        if (isCancelledRef.current) {
          return;
        }

        while (sequentialBatchStartRef.current < LOADED_COUNT) {
          queueBatch(sequentialBatchStartRef.current, false);
          sequentialBatchStartRef.current += BACKGROUND_BATCH_SIZE;
        }
      });
    };

    if (typeof window.IntersectionObserver === 'function' && containerRef.current) {
      observer = new window.IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            startProgressiveLoading();
            observer?.disconnect();
          }
        },
        { rootMargin: '200px 0px' },
      );

      observer.observe(containerRef.current);
    } else {
      startProgressiveLoading();
    }

    return () => {
      isCancelledRef.current = true;
      queuePriorityBatchRef.current = () => {};

      if (observer) {
        observer.disconnect();
      }

      cancelIdleWork(idleHandleRef.current);
      idleHandleRef.current = null;

      pendingImagesRef.current.forEach(({ image }) => {
        if (image) {
          image.onload = null;
          image.onerror = null;
          image.src = '';
        }
      });

      pendingImagesRef.current.clear();
      imagesRef.current = [];
    };
  }, [drawFrame, syncProgressState, syncWarmState]);

  useEffect(() => {
    if (!isInitialBatchReady) {
      return undefined;
    }

    let isAnimating = false;

    const tick = () => {
      const frameDelta = targetFrameRef.current - animatedFrameRef.current;

      if (Math.abs(frameDelta) < 0.4) {
        animatedFrameRef.current = targetFrameRef.current;
        isAnimating = false;
      } else {
        animatedFrameRef.current += frameDelta * 0.2;
        rafRef.current = window.requestAnimationFrame(tick);
      }

      const frameIndex = Math.round(animatedFrameRef.current);
      requestedFrameRef.current = frameIndex;

      const renderedFrame = drawFrame(frameIndex);
      if (renderedFrame !== frameIndex) {
        queuePriorityBatchRef.current(frameIndex);
      }
    };

    const onScroll = () => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const scrollableHeight = Math.max(element.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollableHeight, 0, 1);

      targetFrameRef.current = Math.min(
        Math.floor(progress * (LOADED_COUNT - 1)),
        LOADED_COUNT - 1,
      );

      if (!isAnimating) {
        isAnimating = true;
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [drawFrame, isInitialBatchReady]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: HERO_HEIGHT }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <img
          src={PLACEHOLDER_SRC}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
            isInitialBatchReady ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ filter: 'blur(14px)', transform: 'scale(1.04)' }}
          loading="eager"
          fetchPriority="high"
        />

        <canvas
          ref={canvasRef}
          className={`h-full w-full transition-opacity duration-500 ${
            isInitialBatchReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ display: 'block' }}
        />

        {!isInitialBatchReady && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <h2
              className="mb-8 font-display text-4xl font-bold tracking-wider text-white md:text-6xl"
              style={{ opacity: 0.9 }}
            >
              VRIS
            </h2>
            <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/70 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(loadProgress, 8)}%` }}
              />
            </div>
            <p className="mt-3 font-body text-xs uppercase tracking-[0.3em] text-white/40">
              Warming up {Math.max(loadProgress, 8)}%
            </p>
          </div>
        )}

        {isInitialBatchReady && (
          <motion.div
            className="pointer-events-none absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <motion.span
              className="font-body text-[11px] uppercase tracking-[0.35em] text-white/50"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              Scroll to explore
            </motion.span>
            <motion.div
              className="h-8 w-px bg-white/20"
              animate={{ scaleY: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HeroCanvas;
