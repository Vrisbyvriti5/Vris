import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import { useFilter } from '@/context/FilterContext';
import HorizontalFilterBar from '@/components/HorizontalFilterBar';
import { motion } from 'framer-motion';
import { productsAPI } from '@/lib/api';

const normalizeCategory = (value) => String(value || '').trim().toLowerCase();
const SORT_OPTIONS = [
  { value: 'newest', label: 'New Arrivals' },
  { value: 'popular', label: 'Popular' },
  { value: 'bestseller', label: 'Best Sellers' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
];

const getNumericRating = (product) => Number(
  product.rating
    ?? product.average_rating
    ?? product.averageRating
    ?? product.avg_rating
    ?? 0,
);

const matchesRatingFilter = (product, selectedRating) => {
  if (selectedRating === null) {
    return true;
  }

  const rating = getNumericRating(product);

  // Edge case: unrated products are always included for every rating filter.
  if (!Number.isFinite(rating) || rating <= 0) {
    return true;
  }

  return rating >= Number(selectedRating);
};

const Shop = () => {
  const {
    selectedCategories,
    priceRange,
    selectedRating,
    selectedSizes,
    activeFilterCount,
    setCategories,
  } = useFilter();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const catParam = params.get('cat');
  const collectionParam = params.get('collection');
  const sortParam = params.get('sort');
  const query = params.get('q') || '';
  const activeCollection = collectionParam || 'All';
  const activeSort = sortParam || 'newest';
  const backendSort = (activeSort === 'price-low-high' || activeSort === 'price-high-low' || activeSort === 'popular')
    ? 'diverse-random'
    : activeSort;

  useEffect(() => {
    const normalized = normalizeCategory(catParam);
    setCategories(normalized ? [normalized] : []);
  }, [catParam, setCategories]);

  useEffect(() => {
    let isDisposed = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      setFetchError('');

      try {
        const response = await productsAPI.getAll({
          collection: activeCollection,
          search: query,
          sort: backendSort,
          _ts: Date.now(),
        });

        if (!isDisposed) {
          const normalizedProducts = (response.data || []).map((product) => ({
            ...product,
            id: String(product?.id ?? product?.product_id ?? ''),
            averageRating: Number(product?.average_rating ?? product?.averageRating ?? product?.rating ?? 0),
            reviewCount: Number(product?.review_count ?? product?.reviewCount ?? 0),
            price: Number(product?.price ?? product?.final_price ?? 0),
          }));
          setProducts(normalizedProducts);
        }
      } catch (error) {
        if (!isDisposed) {
          setProducts([]);
          setFetchError(error.data?.message || error.message || 'Unable to fetch products right now.');
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isDisposed = true;
    };
  }, [activeCollection, backendSort, query]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (selectedCategories.length > 0) {
        const productCategory = normalizeCategory(product.category);
        const matchesCategory = selectedCategories.some((category) => normalizeCategory(category) === productCategory);
        if (!matchesCategory) {
          return false;
        }
      }

      const [minPrice, maxPrice] = priceRange;
      const price = Number(product.price ?? product.final_price ?? 0);
      if (!Number.isFinite(price) || price < minPrice || price > maxPrice) {
        return false;
      }

      if (!matchesRatingFilter(product, selectedRating)) {
        return false;
      }

      // Size filter — mock for now (backend doesn't store sizes yet)
      // When sizes are added, uncomment:
      // if (selectedSizes.length > 0) {
      //   const productSizes = (product.sizes || []).map(s => s.toUpperCase());
      //   if (!selectedSizes.some(s => productSizes.includes(s.toUpperCase()))) return false;
      // }

      return true;
    });
    if (activeSort === 'price-low-high') {
      return [...filtered].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (activeSort === 'price-high-low') {
      return [...filtered].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }
    return filtered;
  }, [products, selectedCategories, priceRange, selectedRating, selectedSizes, activeSort]);

  const hasSearch = Boolean(query.trim());
  const hasCategoryFilter = selectedCategories.length > 0;
  const gridAnimationKey = `${selectedCategories.join(',')}|${priceRange.join('-')}|${selectedRating ?? 'none'}|${selectedSizes.join(',')}|${activeSort}`;

  const handleClearSearch = () => {
    const nextParams = new URLSearchParams(params);
    nextParams.delete('q');
    setParams(nextParams, { replace: true });
  };

  const handleSortChange = (nextSort) => {
    const normalizedSort = String(nextSort || 'popular');
    const nextParams = new URLSearchParams(params);

    if (normalizedSort === 'popular') {
      nextParams.delete('sort');
    } else {
      nextParams.set('sort', normalizedSort);
    }

    setParams(nextParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-[144px] md:pt-[104px] pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-[1920px] mx-auto">
        <Link to="/custom-product-request" className="mb-8 block w-[calc(100%+40px)] -ml-5 sm:w-full sm:ml-0 overflow-hidden shadow-sm">
          <img src="https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/custom1.png" alt="Your Vision, Our Craft" className="w-full h-auto object-cover" />
        </Link>

        {/* ── Horizontal Filter Bar ── */}
        <HorizontalFilterBar
          productCount={filteredProducts.length}
          sortValue={activeSort}
          onSortChange={handleSortChange}
          sortOptions={SORT_OPTIONS}
        />

        {fetchError ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-body">
            {fetchError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={`skeleton-${i}`} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            key={gridAnimationKey}
            layout
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground font-body">
              {hasSearch
                ? `No results found for "${query}".`
                : hasCategoryFilter
                  ? 'No products matched your selected filters.'
                  : 'No products found right now.'}
            </p>
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-foreground hover:text-muted-foreground transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
