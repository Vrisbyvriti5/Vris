import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import { useFilter } from '@/context/FilterContext';
import { FilterSidebar, MobileFilterDrawer, FilterButton } from '@/components/FilterSidebar';
import { motion } from 'framer-motion';
import { productsAPI } from '@/lib/api';

const normalizeCategory = (value) => String(value || '').trim().toLowerCase();
const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'bestseller', label: 'Best Sellers' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
];

const GENDER_TOKENS = new Set(['men', 'male', 'women', 'female', 'unisex']);

const extractGenderTokens = (product) => {
  const raw = product.gender ?? product.genders ?? product.collection ?? '';
  return String(raw)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((token) => GENDER_TOKENS.has(token));
};

const matchesGenderFilter = (product, selectedGenders) => {
  if (selectedGenders.length !== 1) {
    return true;
  }

  const selected = selectedGenders[0]?.toLowerCase(); // 'male' or 'female'
  const tokens = extractGenderTokens(product);

  const isMen = tokens.includes('men') || tokens.includes('male');
  const isWomen = tokens.includes('women') || tokens.includes('female');
  const isUnisex = tokens.includes('unisex');

  // If a gender is selected, products MUST have at least one valid gender token.
  // Legacy products with no gender tokens will be hidden in gender-filtered views.
  if (tokens.length === 0) {
    return false;
  }

  if (selected === 'male') {
    return isMen || isUnisex;
  }
  if (selected === 'female') {
    return isWomen || isUnisex;
  }

  return true;
};

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

  if (selectedRating === 'trusted') {
    const reviewCount = Number(product.review_count ?? product.reviewCount ?? 0);
    return Boolean(product.featured) || (rating >= 4 && reviewCount >= 5);
  }

  return rating >= Number(selectedRating);
};

const Shop = () => {
  const {
    selectedCategories,
    selectedGenders,
    priceRange,
    selectedRating,
    selectedDiscount,
    activeFilterCount,
    setCategories,
  } = useFilter();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const catParam = params.get('cat');
  const collectionParam = params.get('collection');
  const sortParam = params.get('sort');
  const query = params.get('q') || '';
  const activeCollection = collectionParam || 'All';
  const activeSort = sortParam || 'popular';
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

      if (!matchesGenderFilter(product, selectedGenders)) {
        return false;
      }

      const [minPrice, maxPrice] = priceRange;
      const price = Number(product.price ?? product.final_price ?? 0);
      if (!Number.isFinite(price) || price < minPrice || price > maxPrice) {
        return false;
      }

      if (!matchesRatingFilter(product, selectedRating)) {
        return false;
      }

      if (selectedDiscount !== null) {
        const discount = Number(product.discount ?? product.discount_percent ?? product.discountPercent ?? 0);
        if (!Number.isFinite(discount) || discount < Number(selectedDiscount)) {
          return false;
        }
      }

      return true;
    });
    if (activeSort === 'price-low-high') {
      return [...filtered].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (activeSort === 'price-high-low') {
      return [...filtered].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }
    return filtered;
  }, [products, selectedCategories, selectedGenders, priceRange, selectedRating, selectedDiscount, activeSort]);

  const hasSearch = Boolean(query.trim());
  const hasCategoryFilter = selectedCategories.length > 0;
  const sortLabel = {
    popular: 'popular picks',
    bestseller: 'bestsellers',
    featured: 'featured picks',
    newest: 'new arrivals',
    'price-low-high': 'price low to high',
    'price-high-low': 'price high to low',
  }[activeSort] || '';
  const gridAnimationKey = `${selectedCategories.join(',')}|${selectedGenders.join(',')}|${priceRange.join('-')}|${selectedRating ?? 'none'}|${selectedDiscount ?? 'none'}|${activeSort}`;

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

      <MobileFilterDrawer isOpen={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} />

      <div className="pt-[128px] md:pt-24 pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-[1920px] mx-auto">
        <Link to="/custom-product-request" className="mb-8 block w-full overflow-hidden shadow-sm">
          <img src="https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/custom1.png" alt="Your Vision, Our Craft" className="w-[143%] max-w-none md:w-full h-auto object-cover object-left" />
        </Link>

        <div className="flex gap-6">
          <div className="hidden lg:block w-[240px] xl:w-[260px] shrink-0">
            <FilterSidebar />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-transparent px-1">
              <p className="text-sm font-medium text-muted-foreground w-full sm:w-auto">
                <span className="lg:hidden block mb-2"><FilterButton onClick={() => setMobileFilterOpen(true)} activeFilterCount={activeFilterCount} /></span>
                Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
              </p>
              
              <div className="flex items-center gap-2 text-sm text-[#4b5563]">
                <span>Sort by:</span>
                <select
                  value={activeSort}
                  onChange={(event) => handleSortChange(event.target.value)}
                  className="h-8 rounded-full border border-gray-200 bg-[#f9fafb] px-3 pr-8 text-sm outline-none transition-colors focus:border-[#e0b090] appearance-none"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b35e6c%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right .7rem top 50%',
                    backgroundSize: '.65rem auto',
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {fetchError ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-body">
                {fetchError}
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
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
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
