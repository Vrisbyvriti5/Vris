export const PRODUCT_CATEGORIES = [
  'Tops',
  'Skirts',
  'Dresses',
  'Full Set',
  'Indo Western',
];

const normalizeCategory = (value) => String(value || '').trim().toLowerCase();

export const isValidCategory = (category) => {
  const normalized = normalizeCategory(category);
  return PRODUCT_CATEGORIES.some(c => c.toLowerCase() === normalized);
};

export const toCategoryLabel = (category) => String(category || '')
  .split(' ')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');
