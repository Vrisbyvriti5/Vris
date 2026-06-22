import React, { useState, useCallback } from 'react';
import { ChevronDown, Search, X, Filter } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { useFilter } from '@/context/FilterContext';
import DualRangeSlider from '@/components/DualRangeSlider';
import { toCategoryLabel } from '@/lib/product-taxonomy';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORY_LIMIT = 8;

const FilterSection = ({ title, isOpen, onToggle, children, badge }) => (
  <div className="border-b border-gray-100">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50/50 transition-colors"
    >
      <span className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{title}</span>
        {badge && (
          <span className="bg-[#e0b090] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      <ChevronDown
        className={cn(
          'h-4 w-4 text-gray-400 transition-transform duration-200',
          isOpen && '-rotate-90'
        )}
      />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="pb-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label
    className={cn(
      'flex items-center gap-2 px-2 py-[6px] rounded cursor-pointer transition-colors hover:bg-gray-50',
      checked && 'bg-[#e0b090]/10'
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div
      className={cn(
        'w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all flex-shrink-0',
        checked
          ? 'bg-[#e0b090] border-[#e0b090]'
          : 'border-gray-300 bg-white'
      )}
    >
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className={cn(
      'text-xs text-gray-700 capitalize leading-tight',
      checked && 'text-[#e0b090] font-medium'
    )}>
      {label}
    </span>
  </label>
);

const RadioOption = ({ label, checked, onChange, groupName }) => (
  <button
    type="button"
    role="radio"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={cn(
      'flex w-full items-center gap-2 px-2 py-[6px] rounded cursor-pointer transition-colors hover:bg-gray-50',
      checked && 'bg-[#e0b090]/10'
    )}
  >
    <span className="sr-only">{groupName}</span>
    <div
      className={cn(
        'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all flex-shrink-0',
        checked
          ? 'border-[#e0b090]'
          : 'border-gray-300'
      )}
    >
      {checked && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#e0b090]" />
      )}
    </div>
    <span className={cn(
      'text-xs text-gray-700 leading-tight',
      checked && 'text-[#e0b090] font-medium'
    )}>
      {label}
    </span>
  </button>
);

const CategoriesContent = ({ selectedCategories, toggleCategory }) => {
  const { categories } = useCatalog();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableCategories = categories.filter((c) => c.toLowerCase() !== 'all');

  const filteredCategories = availableCategories.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayCategories = isExpanded
    ? filteredCategories
    : filteredCategories.slice(0, CATEGORY_LIMIT);

  const hasMore = filteredCategories.length > CATEGORY_LIMIT;

  return (
    <>
      <div className="px-3 pb-1 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">{availableCategories.length} options</span>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-gray-400 hover:text-[#e0b090] transition-colors p-1"
        >
          <Search size={14} />
        </button>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories"
                  className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090]/20 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 space-y-[2px]">
        {displayCategories.map((category) => (
          <Checkbox
            key={category}
            label={toCategoryLabel(category)}
            checked={selectedCategories.includes(category)}
            onChange={() => toggleCategory(category)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="px-3 pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-[#e0b090] hover:underline"
          >
            {isExpanded ? 'Show Less' : `+ ${filteredCategories.length - CATEGORY_LIMIT} More`}
          </button>
        </div>
      )}
    </>
  );
};

const FilterSidebarContent = ({ mobile = false, onClose }) => {
  const {
    selectedCategories,
    selectedGenders,
    selectedRating,
    selectedDiscount,
    clearAll,
    activeFilterCount,
    toggleCategory,
    toggleGender,
    setRating,
    setDiscount,
  } = useFilter();

  const [openSections, setOpenSections] = useState({
    categories: true,
    gender: true,
    price: true,
    rating: false,
    discount: false,
  });

  const handleToggle = useCallback((section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    clearAll();
    onClose?.();
  }, [clearAll, onClose]);

  return (
    <div className="flex flex-col h-full bg-white">
      {!mobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">FILTERS</h2>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-medium text-[#e0b090] hover:underline"
            >
              CLEAR ALL
            </button>
          )}
        </div>
      )}

      {mobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">FILTERS</h2>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-[#e0b090] hover:underline"
              >
                CLEAR ALL
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className={cn(mobile && 'flex-1 overflow-y-auto overscroll-contain no-scrollbar')}>
        <FilterSection
          title="CATEGORIES"
          isOpen={openSections.categories}
          onToggle={() => handleToggle('categories')}
          badge={selectedCategories.length > 0 ? selectedCategories.length : null}
        >
          <CategoriesContent selectedCategories={selectedCategories} toggleCategory={toggleCategory} />
        </FilterSection>

        <FilterSection
          title="GENDER"
          isOpen={openSections.gender}
          onToggle={() => handleToggle('gender')}
          badge={selectedGenders.length > 0 ? selectedGenders.length : null}
        >
          <div className="px-3 space-y-[2px]">
            {[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }].map((gender) => (
              <Checkbox
                key={gender.value}
                label={gender.label}
                checked={selectedGenders.includes(gender.value)}
                onChange={() => toggleGender(gender.value)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection
          title="PRICE"
          isOpen={openSections.price}
          onToggle={() => handleToggle('price')}
        >
          <DualRangeSlider />
        </FilterSection>

        <FilterSection
          title="RATING"
          isOpen={openSections.rating}
          onToggle={() => handleToggle('rating')}
          badge={selectedRating !== null ? '1' : null}
        >
          <div className="px-3 space-y-[2px]">
            {[
              { label: '2★ & above', value: 2 },
              { label: '3★ & above', value: 3 },
              { label: '3.5★ & above', value: 3.5 },
              { label: '4★ & above', value: 4 },
            ].map(({ label, value }) => (
              <RadioOption
                key={value}
                label={label}
                checked={selectedRating === value}
                onChange={() => setRating(value)}
                groupName="rating"
              />
            ))}
            <div className="border-t border-gray-100 my-2" />
            <RadioOption
              label="N-Trusted"
              checked={selectedRating === 'trusted'}
              onChange={() => setRating('trusted')}
              groupName="rating"
            />
          </div>
        </FilterSection>

        <FilterSection
          title="DISCOUNT RANGE"
          isOpen={openSections.discount}
          onToggle={() => handleToggle('discount')}
          badge={selectedDiscount !== null ? '1' : null}
        >
          <div className="px-3 space-y-[2px]">
            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((value) => (
              <RadioOption
                key={value}
                label={`${value}% and above`}
                checked={selectedDiscount === value}
                onChange={() => setDiscount(value)}
                groupName="discount"
              />
            ))}
          </div>
        </FilterSection>
      </div>

      {mobile && (
        <div className="border-t border-gray-100 px-4 py-3 bg-white">
          <button
            className="w-full bg-[#e0b090] text-white text-sm font-bold py-3 rounded hover:bg-[#e6395d] transition-colors uppercase tracking-wide"
            onClick={onClose}
          >
            {activeFilterCount > 0 ? `APPLY (${activeFilterCount})` : 'APPLY'}
          </button>
        </div>
      )}
    </div>
  );
};

export const FilterSidebar = () => (
  <aside className="hidden w-[280px] border-r border-gray-100 bg-white lg:block">
    <FilterSidebarContent />
  </aside>
);

export const MobileFilterDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[300px] bg-white shadow-xl"
      >
        <FilterSidebarContent mobile onClose={onClose} />
      </motion.div>
    </div>
  );
};

export const FilterButton = ({ onClick, activeFilterCount }) => (
  <button
    onClick={onClick}
    className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded bg-white text-xs font-bold uppercase tracking-wider text-gray-700 hover:border-[#e0b090] hover:text-[#e0b090] transition-colors"
  >
    <Filter size={14} />
    FILTERS
    {activeFilterCount > 0 && (
      <span className="bg-[#e0b090] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
        {activeFilterCount}
      </span>
    )}
  </button>
);
