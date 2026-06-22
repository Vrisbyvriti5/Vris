import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { useFilter } from '@/context/FilterContext';
import DualRangeSlider from '@/components/DualRangeSlider';
import { toCategoryLabel } from '@/lib/product-taxonomy';
import { cn } from '@/lib/utils';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const RATING_OPTIONS = [
  { label: '4★ & above', value: 4 },
  { label: '3★ & above', value: 3 },
  { label: '2★ & above', value: 2 },
];

/* ── Dropdown wrapper ─────────────────────────────────── */
const FilterDropdown = ({ label, isOpen, onToggle, onClose, hasActive, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-colors rounded-sm border',
          isOpen
            ? 'border-[#e0b090] text-[#e0b090]'
            : hasActive
              ? 'border-[#e0b090]/40 text-[#e0b090]'
              : 'border-transparent text-gray-700 hover:text-gray-900'
        )}
      >
        {label}
        <ChevronDown
          size={13}
          className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[220px] rounded-md border border-gray-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

/* ── Checkbox ─────────────────────────────────── */
const CheckItem = ({ label, checked, onChange }) => (
  <label
    className={cn(
      'flex items-center gap-2.5 px-3 py-[7px] cursor-pointer transition-colors hover:bg-gray-50',
      checked && 'bg-[#e0b090]/5'
    )}
  >
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    <div
      className={cn(
        'w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all flex-shrink-0',
        checked ? 'bg-[#e0b090] border-[#e0b090]' : 'border-gray-300 bg-white'
      )}
    >
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className={cn('text-xs text-gray-700 capitalize', checked && 'text-[#e0b090] font-medium')}>
      {label}
    </span>
  </label>
);

/* ── Radio ─────────────────────────────────── */
const RadioItem = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={cn(
      'flex w-full items-center gap-2.5 px-3 py-[7px] cursor-pointer transition-colors hover:bg-gray-50',
      checked && 'bg-[#e0b090]/5'
    )}
  >
    <div
      className={cn(
        'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all flex-shrink-0',
        checked ? 'border-[#e0b090]' : 'border-gray-300'
      )}
    >
      {checked && <div className="w-1.5 h-1.5 rounded-full bg-[#e0b090]" />}
    </div>
    <span className={cn('text-xs text-gray-700', checked && 'text-[#e0b090] font-medium')}>
      {label}
    </span>
  </button>
);

/* ── Main Component ─────────────────────────────────── */
const HorizontalFilterBar = ({ productCount, sortValue, onSortChange, sortOptions }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const {
    selectedCategories,
    priceRange,
    selectedRating,
    selectedSizes,
    toggleCategory,
    setRating,
    toggleSize,
    clearAll,
    activeFilterCount,
  } = useFilter();

  const { categories } = useCatalog();
  const availableCategories = categories.filter((c) => c.toLowerCase() !== 'all');

  const handleToggle = useCallback((key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  const handleClose = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 mb-6">
      {/* ── Left: Filter dropdowns ── */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-xs font-medium text-gray-500 mr-1 tracking-wide">Filter:</span>

        {/* Categories */}
        <FilterDropdown
          label="Categories"
          isOpen={openDropdown === 'categories'}
          onToggle={() => handleToggle('categories')}
          onClose={handleClose}
          hasActive={selectedCategories.length > 0}
        >
          <div className="py-1 max-h-[260px] overflow-y-auto">
            {availableCategories.map((cat) => (
              <CheckItem
                key={cat}
                label={toCategoryLabel(cat)}
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* Price */}
        <FilterDropdown
          label="Price"
          isOpen={openDropdown === 'price'}
          onToggle={() => handleToggle('price')}
          onClose={handleClose}
          hasActive={priceRange[0] !== 0 || priceRange[1] !== 10000}
        >
          <div className="p-3 min-w-[260px]">
            <DualRangeSlider />
          </div>
        </FilterDropdown>

        {/* Rating */}
        <FilterDropdown
          label="Rating"
          isOpen={openDropdown === 'rating'}
          onToggle={() => handleToggle('rating')}
          onClose={handleClose}
          hasActive={selectedRating !== null}
        >
          <div className="py-1">
            {RATING_OPTIONS.map(({ label, value }) => (
              <RadioItem
                key={value}
                label={label}
                checked={selectedRating === value}
                onChange={() => setRating(value)}
              />
            ))}
            {selectedRating !== null && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => setRating(selectedRating)}
                  className="w-full text-left px-3 py-[7px] text-xs text-[#e0b090] font-medium hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </FilterDropdown>

        {/* Size */}
        <FilterDropdown
          label="Size"
          isOpen={openDropdown === 'size'}
          onToggle={() => handleToggle('size')}
          onClose={handleClose}
          hasActive={selectedSizes.length > 0}
        >
          <div className="py-1 max-h-[260px] overflow-y-auto">
            {SIZE_OPTIONS.map((size) => (
              <CheckItem
                key={size}
                label={size}
                checked={selectedSizes.includes(size)}
                onChange={() => toggleSize(size)}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* Clear all pill */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            Clear All <X size={10} />
          </button>
        )}
      </div>

      {/* ── Right: Sort + count ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Sort by:</span>
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-7 rounded border border-gray-200 bg-gray-50 px-2.5 pr-7 text-xs text-gray-700 outline-none transition-colors focus:border-[#e0b090] appearance-none cursor-pointer"
            style={{
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right .5rem top 50%',
              backgroundSize: '.55rem auto',
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          {productCount} product{productCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
};

export default HorizontalFilterBar;
