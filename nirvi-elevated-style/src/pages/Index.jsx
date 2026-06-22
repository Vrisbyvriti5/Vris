import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  {
    id: 2,
    src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038691204-60363ba52cb1-Second.webp',
    alt: 'High fashion editorial — runway look',
  },
  {
    id: 3,
    src: 'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1782038691125-2a41b4555745-third2.webp',
    alt: 'Premium women fashion — elegant pose',
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

const INSTA_POSTERS = [
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=700&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=700&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=700&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=700&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=700&q=80&auto=format&fit=crop',
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
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const goTo = (index) => {
    setCurrent(index);
    startTimer();
  };

  return (
    <section className="hp-hero" id="hp-hero">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className={`hp-hero__slide ${i === current ? 'hp-hero__slide--active' : ''}`}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="hp-hero__img"
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding={i === 0 ? 'sync' : 'async'}
          />
        </div>
      ))}
      <div className="hp-hero__indicators">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hp-hero__dot ${i === current ? 'hp-hero__dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
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

  return (
    <section
      ref={ref}
      className={`hp-insta hp-reveal ${visible ? 'hp-reveal--visible' : ''}`}
      id="hp-instagram"
    >
      <h2 className="hp-insta__heading">Our Instagram</h2>
      <p className="hp-insta__subheading">Follow us for daily inspiration</p>
      {/* Desktop: grid | Mobile: horizontal scroll */}
      <div className="hp-insta__grid hp-insta__grid--desktop">
        {INSTA_POSTERS.map((poster, i) => (
          <div key={i} className="hp-insta__card">
            <img
              src={poster}
              alt={`Instagram reel ${i + 1}`}
              className="hp-insta__poster"
              loading="lazy"
              decoding="async"
            />
            <div className="hp-insta__play">
              <div className="hp-insta__play-icon" />
            </div>
          </div>
        ))}
      </div>
      <div className="hp-insta__scroll hp-insta__scroll--mobile" ref={scrollRef}>
        {INSTA_POSTERS.map((poster, i) => (
          <div key={i} className="hp-insta__scroll-card">
            <img
              src={poster}
              alt={`Instagram reel ${i + 1}`}
              className="hp-insta__poster"
              loading="lazy"
              decoding="async"
            />
            <div className="hp-insta__play">
              <div className="hp-insta__play-icon" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SECTION 9 — Shop The Look
// ═══════════════════════════════════════════════════════════════════════
const ShopTheLook = () => {
  const { products, loading } = useCatalog();
  const [ref, visible] = useReveal();
  const shopProducts = products.slice(0, SHOP_PRODUCT_COUNT);

  return (
    <section
      ref={ref}
      className={`hp-shop hp-reveal ${visible ? 'hp-reveal--visible' : ''}`}
      id="hp-shop-the-look"
    >
      <h2 className="hp-shop__heading">Shop The Look</h2>
      <p className="hp-shop__subheading">Curated styles for every occasion</p>
      <div className="hp-shop__grid">
        {loading
          ? Array.from({ length: SHOP_PRODUCT_COUNT }).map((_, i) => (
              <ProductSkeleton key={`skeleton-${i}`} index={i} />
            ))
          : shopProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} eagerCount={SHOP_PRODUCT_COUNT} />
            ))}
      </div>
      <div className="hp-shop__cta-wrap">
        <Link to="/shop" className="hp-shop__cta">
          View All Products
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

      {/* SECTION 3 — Full-width promo image (mobile: 40vh) */}
      <FullBleedImage
        src={PROMO_FULL_1}
        alt="Luxury fashion campaign — editorial collection"
        id="hp-promo-1"
        mobileHeight="60"
      />

      {/* SECTION 4 — Full-width promo image (mobile: 40vh) */}
      <FullBleedImage
        src={PROMO_FULL_2}
        alt="Premium fashion — shopping editorial"
        id="hp-promo-2"
        mobileHeight="60"
      />

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
