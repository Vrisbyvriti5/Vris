import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const FilterContext = createContext(undefined);
const DEFAULT_FILTERS = Object.freeze({
  categories: [],
  priceRange: [0, 10000],
  rating: null,
  sizes: [],
});

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const toggleCategory = useCallback((category) => {
    setFilters((current) => {
      const categories = current.categories.includes(category)
        ? current.categories.filter((entry) => entry !== category)
        : [...current.categories, category];
      return { ...current, categories };
    });
  }, []);

  const setCategories = useCallback((categories) => {
    const normalized = Array.isArray(categories)
      ? categories.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean)
      : [];
    setFilters((current) => ({ ...current, categories: [...new Set(normalized)] }));
  }, []);

  const setPriceRange = useCallback((range) => {
    if (!Array.isArray(range) || range.length !== 2) {
      return;
    }

    const nextMin = Number(range[0]);
    const nextMax = Number(range[1]);
    if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax)) {
      return;
    }

    setFilters((current) => ({ ...current, priceRange: [nextMin, nextMax] }));
  }, []);

  const setRating = useCallback((rating) => {
    setFilters((current) => ({
      ...current,
      rating: current.rating === rating ? null : rating,
    }));
  }, []);

  const toggleSize = useCallback((size) => {
    setFilters((current) => {
      const sizes = current.sizes.includes(size)
        ? current.sizes.filter((entry) => entry !== size)
        : [...current.sizes, size];
      return { ...current, sizes };
    });
  }, []);

  const clearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => ([
    filters.categories.length > 0,
    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000,
    filters.rating !== null,
    filters.sizes.length > 0,
  ].filter(Boolean).length), [filters]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        selectedCategories: filters.categories,
        priceRange: filters.priceRange,
        selectedRating: filters.rating,
        selectedSizes: filters.sizes,
        toggleCategory,
        setCategories,
        setPriceRange,
        setRating,
        toggleSize,
        clearAll,
        activeFilterCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
};
