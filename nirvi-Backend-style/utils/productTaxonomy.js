const PRODUCT_CATEGORIES = [
  'Tops',
  'Skirts',
  'Dresses',
  'Full Set'
];

const normalizeWhitespace = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeCategory = (value) => {
  const normalized = normalizeWhitespace(value);
  const lower = normalized.toLowerCase();

  const found = PRODUCT_CATEGORIES.find(cat => cat.toLowerCase() === lower);
  return found || null;
};

const resolveProductTaxonomy = ({ category } = {}) => {
  const normalizedCategory = normalizeCategory(category);

  if (!normalizedCategory) {
    return {
      valid: false,
      message: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}.`,
    };
  }

  return {
    valid: true,
    category: normalizedCategory
  };
};

const isValidCategory = (value) => Boolean(normalizeCategory(value));

module.exports = {
  PRODUCT_CATEGORIES,
  normalizeCategory,
  resolveProductTaxonomy,
  isValidCategory,
};
