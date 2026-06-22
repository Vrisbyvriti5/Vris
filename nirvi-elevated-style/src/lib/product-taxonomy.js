export const PRODUCT_CATEGORIES = [
  'bag charms',
  'caps',
  'flex',
  'keychains',
  'laptop sleeves',
  'pouches',
  'totebags',
  'bracelets',
  'shoes',
];

export const PRODUCT_COLLECTIONS = ['Denim', 'Wool', 'Flex', 'Women', 'Men', 'Unisex'];

// Two-group collection rule: every product gets exactly one from each group.
export const MATERIAL_COLLECTIONS = ['Denim', 'Wool', 'Flex'];
export const GENDER_COLLECTIONS = ['Men', 'Women', 'Unisex'];

// Material-based default mapping (used only as a fallback suggestion).
export const CATEGORY_TO_COLLECTION = Object.freeze({
  'bag charms': 'Wool',
  caps: 'Denim',
  flex: 'Flex',
  keychains: 'Denim',
  'laptop sleeves': 'Denim',
  pouches: 'Denim',
  totebags: 'Denim',
  bracelets: 'Wool',
  shoes: 'Flex',
});

const normalizeCategory = (value) => String(value || '').trim().toLowerCase();
const normalizeCollection = (value) => String(value || '').trim().toLowerCase();

export const getCollectionForCategory = (category) => {
  const normalized = normalizeCategory(category);
  return CATEGORY_TO_COLLECTION[normalized] || null;
};

export const isValidCategory = (category) => PRODUCT_CATEGORIES.includes(normalizeCategory(category));

export const isValidCollection = (collection) => {
  const normalized = normalizeCollection(collection);
  return PRODUCT_COLLECTIONS.some((entry) => entry.toLowerCase() === normalized);
};

export const toCategoryLabel = (category) => String(category || '')
  .split(' ')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

