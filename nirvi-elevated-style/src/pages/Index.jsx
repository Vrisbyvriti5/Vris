import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Instagram, Play } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCatalog } from '@/context/CatalogContext';
import './HomePage.css';

// ═══════════════════════════════════════════════════════════════════════
// IMAGE DATA — All from Unsplash/Pexels (luxury fashion, editorial)
// ═══════════════════════════════════════════════════════════════════════

const HERO_SLIDES = [
  {
    id: 1,
    src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1783033831430-fa48999cd164-thirdd.webp',
    alt: 'Luxury fashion editorial — model in designer outfit',
  },
  {
    id: 2,
    src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1783033831977-086ebfc6c2bc-secondd.webp',
    alt: 'Luxury fashion editorial — elegant look',
  },
  {
    id: 3,
    src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1783033832075-7c24c169c607-Firstt.webp',
    alt: 'Luxury fashion editorial — signature style',
  },
];

const PROMO_FULL_1 = 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038690810-4e556c0cc880-fourth2.webp';
const PROMO_FULL_2 = 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038731927-fdeaf757836e-Fifth2.webp';
const PROMO_FULL_3 = 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038732041-7fd935dbef41-sixth2.webp';
const PROMO_FULL_4 = 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038732126-996bff7d90ee-seventh.webp';
const PROMO_FULL_5 = 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038731671-1ab5a6d98ebf-eight2.webp';

const PROMO_CARDS = [
  { title: 'New Arrivals', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038642432-9a45d50cfe2d-Psecond.webp' },
  { title: 'Best Sellers', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038641923-e06bab68586b-pfourth.webp' },
  { title: 'Trending Now', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038642495-a8dae01c0aa5-Pone.webp' },
  { title: 'Limited Edition', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038642362-d7db064fef02-Pthird.webp' },
];

const INSTAGRAM_REELS = [
  {
    id: 1,
    videoUrl: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/vris+reel+3.webm',
    instagramUrl: 'https://www.instagram.com/reel/DZsFnoThqPA/?igsh=MWl0eGszaHhzbmV1cA==',
    views: '21.4k',
  },
  {
    id: 2,
    videoUrl: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/vris.webm',
    instagramUrl: 'https://www.instagram.com/reel/DZpAn5zBphN/?igsh=MXF3ZnlnZmY4b2x5Mg==',
    views: '10.3k',
  },
  {
    id: 3,
    videoUrl: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/IMG_8782.webm',
    instagramUrl: 'https://www.instagram.com/reel/DZ4sfasha8w/?igsh=eGIwZHMxNzhraGdk',
    views: '15.1k',
  },
  {
    id: 4,
    videoUrl: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/IMG_8260.webm',
    instagramUrl: 'https://www.instagram.com/reel/DaAgYrah1LG/?igsh=aGFzeDBxOWtqMzJp',
    views: '8.2k',
  },
  {
    id: 5,
    videoUrl: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/IMG_8284.webm',
    instagramUrl: 'https://www.instagram.com/reel/DZcgnEXhMDS/?igsh=bGNmOHYyaTRhNGM5',
    views: '32.5k',
  },
  {
    id: 6,
    videoUrl: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/IMG_4645.webm',
    instagramUrl: 'https://www.instagram.com/reel/DaKqFXnh2m2/?igsh=OHNjMWxoYnVpNzRo',
    views: '12.8k',
  },
];

const SHOP_PRODUCT_COUNT = 8;

// ═══════════════════════════════════════════════════════════════════════
// Scroll Reveal Hook
// ═══════════════════════════════════════════════════════════════════════
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
};

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2 — Hero Carousel
// ═══════════════════════════════════════════════════════════════════════
const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 2000);
    
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section 
      className="hp-hero" 
      id="hp-hero"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {HERO_SLIDES.map((slide, idx) => (
        <div 
          key={slide.id}
          className={`hp-hero__slide ${idx === currentSlide ? 'hp-hero__slide--active' : ''}`}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="hp-hero__img"
            loading={idx === 0 ? "eager" : "lazy"}
            decoding={idx === 0 ? "sync" : "async"}
          />
        </div>
      ))}
      <div className="hp-hero__indicators">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={`hp-hero__dot ${idx === currentSlide ? 'hp-hero__dot--active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Full-Bleed Image Section
// ═══════════════════════════════════════════════════════════════════════
const FullBleedImage = ({ src, alt, id, mobileHeight }) => (
  <section className="hp-fullbleed" id={id}>
    <img
      src={src}
      alt={alt}
      className={`hp-fullbleed__img${mobileHeight ? ` hp-mob-h-${mobileHeight}` : ''}`}
      loading="lazy"
      decoding="async"
    />
  </section>
);

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6 — Promo Cards
// ═══════════════════════════════════════════════════════════════════════
const CATEGORY_CARDS = [
  { title: 'Tops', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1783188561366-1128e026c30e-Catone.webp', to: '/shop?cat=tops' },
  { title: 'Skirts', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1783188503890-0f854ea8a047-carfour.webp', to: '/shop?cat=skirts' },
  { title: 'Dresses', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1783188504150-8d0d4fdff658-catthird.webp', to: '/shop?cat=dresses' },
  { title: 'Full Set', src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1783188504221-7aebc1eca5ec-Catsecond.webp', to: '/shop?cat=full%20set' },
];

const ShopByCategories = () => {
  const [ref, visible] = useReveal();

  return (
    <section
      ref={ref}
      className={`hp-shop hp-reveal ${visible ? 'hp-reveal--visible' : ''}`}
      id="hp-shop-by-categories"
    >
      <h2 className="hp-shop__heading">Shop By Categories</h2>
      <p className="hp-shop__subheading">Explore our exclusive collections tailored for your lifestyle</p>
      
      <div className="hp-promo-cards" style={{ marginTop: '40px' }}>
        {CATEGORY_CARDS.map((card, idx) => (
          <Link to={card.to} key={idx} className="hp-promo-card block cursor-pointer transition-transform hover:scale-[1.02]" style={{ background: '#f5f5f5', aspectRatio: '9/16' }}>
            {card.src ? (
              <img
                src={card.src}
                alt={card.title}
                className="hp-promo-card__img"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaeaea' }}>
                <span style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase' }}>
                  Image Placeholder
                </span>
              </div>
            )}
            <div className="hp-promo-card__overlay">
              <h3 className="hp-promo-card__title">{card.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const PromoCards = () => {
  const [ref, visible] = useReveal();

  return (
    <section
      ref={ref}
      className={`hp-promo-cards hp-reveal ${visible ? 'hp-reveal--visible' : ''}`}
      id="hp-promo-cards"
    >
      {PROMO_CARDS.map((card) => (
        <div key={card.title} className="hp-promo-card">
          <img
            src={card.src}
            alt={card.title}
            className="hp-promo-card__img"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SECTION 7 — Instagram
// ═══════════════════════════════════════════════════════════════════════
const InstagramSection = () => {
  const [ref, visible] = useReveal();
  const scrollRef = useRef(null);
  const [activeReel, setActiveReel] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeReel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeReel]);

  return (
    <>
      <section
        ref={ref}
        className={`hp-insta hp-reveal ${visible ? 'hp-reveal--visible' : ''}`}
        id="hp-instagram"
      >
        <h2 className="hp-insta__heading">Our Instagram</h2>
        <p className="hp-insta__subheading">Follow us for daily inspiration</p>

        <div className="relative max-w-[1400px] mx-auto group">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
            className="absolute left-0 sm:-left-4 top-[40%] sm:top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white border border-gray-200 shadow-md rounded-full text-gray-800 opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="hp-insta__carousel" ref={scrollRef}>
            {INSTAGRAM_REELS.map((reel) => (
              <div key={reel.id} className="hp-insta__card" onClick={() => setActiveReel(reel)}>
                <video
                  src={reel.videoUrl}
                  className="hp-insta__poster"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white font-medium text-sm z-10 drop-shadow-md">
                  <Play size={16} fill="currentColor" />
                  <span>{reel.views}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
            className="absolute right-0 sm:-right-4 top-[40%] sm:top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white border border-gray-200 shadow-md rounded-full text-gray-800 opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Fullscreen Video Modal */}
      {activeReel && (
        <div className="hp-insta__modal" onClick={() => setActiveReel(null)}>
          <div className="hp-insta__modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="hp-insta__modal-close" onClick={() => setActiveReel(null)}>
              <X size={28} />
            </button>

            <video
              src={activeReel.videoUrl}
              className="hp-insta__modal-video"
              autoPlay
              loop
              controls
              playsInline
            />

            <a
              href={activeReel.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hp-insta__modal-link"
            >
              <Instagram size={20} />
              Open in Instagram
            </a>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SECTION 9 — Shop The Look
// ═══════════════════════════════════════════════════════════════════════
const ShopTheLook = () => {
  const { products, loading } = useCatalog();
  const [ref, visible] = useReveal();
  const scrollRef = useRef(null);
  const shopProducts = products.slice(0, SHOP_PRODUCT_COUNT);

  const scroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={ref}
      className={`hp-shop hp-reveal ${visible ? 'hp-reveal--visible' : ''}`}
      id="hp-shop-the-look"
    >
      <h2 className="hp-shop__heading">Shop The Look</h2>
      <p className="hp-shop__subheading">Curated styles for every occasion</p>

      <div className="relative max-w-[1400px] mx-auto group">
        <button
          onClick={() => scroll(-400)}
          className="absolute left-0 sm:-left-4 top-[40%] sm:top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white border border-gray-200 shadow-md rounded-full text-gray-800 opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-gray-50"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="hp-shop__grid" ref={scrollRef}>
          {loading
            ? Array.from({ length: SHOP_PRODUCT_COUNT }).map((_, i) => (
              <ProductSkeleton key={`skeleton-${i}`} index={i} />
            ))
            : shopProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} eagerCount={SHOP_PRODUCT_COUNT} />
            ))}
        </div>

        <button
          onClick={() => scroll(400)}
          className="absolute right-0 sm:-right-4 top-[40%] sm:top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white border border-gray-200 shadow-md rounded-full text-gray-800 opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-gray-50"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="hp-shop__cta-wrap">
        <Link to="/shop" className="hp-shop__cta">
          View All
        </Link>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Index Page — Main Composition
// ═══════════════════════════════════════════════════════════════════════
const Index = () => {
  return (
    <div className="hp-root">
      {/* SECTION 1 — Navbar (untouched) */}
      <Navbar />

      {/* SECTION 2 — Hero Carousel */}
      <HeroCarousel />

      {/* SECTION 5 — Shop By Categories */}
      <ShopByCategories />

      {/* SECTION 6 — Promotional Cards */}
      <PromoCards />

      {/* SECTION 7 — Instagram */}
      <InstagramSection />

      {/* SECTION 8 — Full-width premium banner (mobile: 30vh) */}
      <FullBleedImage
        src={PROMO_FULL_4}
        alt="Premium fashion editorial — designer wear"
        id="hp-promo-4"
        mobileHeight="50"
      />

      {/* SECTION 9 — Shop The Look */}
      <ShopTheLook />

      {/* SECTION 10 — Full-width luxury banner (mobile: 50vh) */}
      <FullBleedImage
        src={PROMO_FULL_5}
        alt="Luxury fashion — elegant editorial"
        id="hp-promo-5"
        mobileHeight="70"
      />

      {/* SECTION 11 — Footer (untouched) */}
      <Footer />
    </div>
  );
};

export default Index;
