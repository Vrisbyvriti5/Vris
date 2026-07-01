import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Instagram } from 'lucide-react';
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
    src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038691292-49467ab07788-First.webp',
    alt: 'Luxury fashion editorial — model in designer outfit',
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
    // Note: You need to provide a direct .mp4 file link for the video to play here.
    videoUrl: 'https://cdn.pixabay.com/video/2019/11/04/28731-371239868_large.mp4', 
    instagramUrl: 'https://www.instagram.com/reel/DZcgnEXhMDS/?igsh=bGNmOHYyaTRhNGM5',
    poster: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=700&q=80&auto=format&fit=crop',
  },
  {
    id: 2,
    videoUrl: 'https://cdn.pixabay.com/video/2020/05/25/40141-424855497_large.mp4',
    instagramUrl: 'https://www.instagram.com/reel/DZpAn5zBphN/?igsh=MXF3ZnlnZmY4b2x5Mg==',
    poster: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=700&q=80&auto=format&fit=crop',
  },
  {
    id: 3,
    videoUrl: 'https://cdn.pixabay.com/video/2020/03/17/33827-398717878_large.mp4',
    instagramUrl: 'https://www.instagram.com/reel/DZsFnoThqPA/?igsh=MWl0eGszaHhzbmV1cA==',
    poster: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=700&q=80&auto=format&fit=crop',
  },
  {
    id: 4,
    videoUrl: 'https://cdn.pixabay.com/video/2021/08/17/85338-589366627_large.mp4',
    instagramUrl: 'https://www.instagram.com/reel/DZ4sfasha8w/?igsh=eGIwZHMxNzhraGdk',
    poster: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=700&q=80&auto=format&fit=crop',
  },
  {
    id: 5,
    videoUrl: 'https://cdn.pixabay.com/video/2020/09/27/50800-463870685_large.mp4',
    instagramUrl: 'https://www.instagram.com/reel/DaAgYrah1LG/?igsh=aGFzeDBxOWtqMzJp',
    poster: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=700&q=80&auto=format&fit=crop',
  },
  {
    id: 6,
    videoUrl: 'https://cdn.pixabay.com/video/2019/11/04/28731-371239868_large.mp4',
    instagramUrl: 'https://www.instagram.com/reel/DaKqFXnh2m2/?igsh=OHNjMWxoYnVpNzRo',
    poster: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=700&q=80&auto=format&fit=crop',
  },
  {
    id: 7,
    videoUrl: 'https://cdn.pixabay.com/video/2020/05/25/40141-424855497_large.mp4',
    instagramUrl: 'https://www.instagram.com/reel/DZe9qMlhaVd/?igsh=NXFvczhraDJ1aWgz',
    poster: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=700&q=80&auto=format&fit=crop',
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
  return (
    <section className="hp-hero" id="hp-hero">
      <div className="hp-hero__slide hp-hero__slide--active">
        <img
          src={HERO_SLIDES[0].src}
          alt={HERO_SLIDES[0].alt}
          className="hp-hero__img"
          loading="eager"
          decoding="sync"
        />
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
                  poster={reel.poster}
                  className="hp-insta__poster"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="hp-insta__play">
                  <div className="hp-insta__play-icon" />
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

      {/* SECTION 5 — Full-width promo image (mobile: 40vh) */}
      <FullBleedImage
        src={PROMO_FULL_3}
        alt="Fashion runway — luxury clothing"
        id="hp-promo-3"
        mobileHeight="60"
      />

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
