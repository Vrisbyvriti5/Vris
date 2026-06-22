const PRODUCT_CATEGORIES = [
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

const PRODUCT_COLLECTIONS = ['Denim', 'Wool', 'Flex', 'Women', 'Men', 'Unisex'];

// Two-group collection rule: every product gets exactly one from each group.
const MATERIAL_COLLECTIONS = ['Denim', 'Wool', 'Flex'];
const GENDER_COLLECTIONS = ['Women', 'Men', 'Unisex'];

// Material-based default collection for legacy auto-inference.
// Gender collections (Women, Men, Unisex) are set manually in admin.
const CATEGORY_TO_COLLECTION = Object.freeze({
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

const COLLECTION_NORMALIZER = Object.freeze({
  denim: 'Denim',
  wool: 'Wool',
  flex: 'Flex',
  women: 'Women',
  men: 'Men',
  unisex: 'Unisex',
});

const CATEGORY_ALIASES = Object.freeze({
  'bag charm': 'bag charms',
  'bag charms': 'bag charms',
  charm: 'bag charms',
  charms: 'bag charms',
  dangler: 'bag charms',
  danglers: 'bag charms',
  cap: 'caps',
  caps: 'caps',
  hat: 'caps',
  hats: 'caps',
  beanie: 'caps',
  beanies: 'caps',
  flex: 'flex',
  keychain: 'keychains',
  keychains: 'keychains',
  'laptop sleeve': 'laptop sleeves',
  'laptop sleeves': 'laptop sleeves',
  sleeve: 'laptop sleeves',
  sleeves: 'laptop sleeves',
  folio: 'laptop sleeves',
  folios: 'laptop sleeves',
  pouch: 'pouches',
  pouches: 'pouches',
  crossbody: 'pouches',
  sling: 'pouches',
  tote: 'totebags',
  'tote bag': 'totebags',
  'tote bags': 'totebags',
  totebag: 'totebags',
  totebags: 'totebags',
  bracelet: 'bracelets',
  bracelets: 'bracelets',
  accessories: 'keychains',
  accessory: 'keychains',
  bags: 'totebags',
  bag: 'totebags',
  shoes: 'shoes',
  shoe: 'shoes',
  sneaker: 'shoes',
  sneakers: 'shoes',
  loafer: 'shoes',
  loafers: 'shoes',
  'high-top': 'shoes',
  'high tops': 'shoes',
  'high-top sneakers': 'shoes',
});

const normalizeWhitespace = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeCategory = (value) => {
  const normalized = normalizeWhitespace(value).toLowerCase();

  if (!normalized) {
    return null;
  }

  if (PRODUCT_CATEGORIES.includes(normalized)) {
    return normalized;
  }

  return CATEGORY_ALIASES[normalized] || null;
};

const normalizeCollection = (value) => {
  const normalized = normalizeWhitespace(value).toLowerCase();

  if (!normalized) {
    return null;
  }

  return COLLECTION_NORMALIZER[normalized] || null;
};

const inferCategoryFromText = ({ category, name, description }) => {
  const directCategory = normalizeCategory(category);
  if (directCategory) {
    return directCategory;
  }

  const haystack = `${normalizeWhitespace(name)} ${normalizeWhitespace(description)} ${normalizeWhitespace(category)}`.toLowerCase();

  if (/key\s*chain/.test(haystack)) return 'keychains';
  if (/bracelet/.test(haystack)) return 'bracelets';
  if (/(bag\s*charm|\bcharm\b|dangler)/.test(haystack)) return 'bag charms';
  if (/(laptop\s*sleeve|\bsleeve\b|folio)/.test(haystack)) return 'laptop sleeves';
  if (/(pouch|crossbody|sling)/.test(haystack)) return 'pouches';
  if (/(\bcap\b|\bhat\b|beanie)/.test(haystack)) return 'caps';
  if (/(shoe|sneaker|loafer|high\s*-?\s*top)/.test(haystack)) return 'shoes';
  if (/(\bflex\b)/.test(haystack)) return 'flex';
  if (/tote/.test(haystack)) return 'totebags';

  return null;
};

const resolveCollectionFromCategory = (category) => CATEGORY_TO_COLLECTION[category] || null;

const resolveProductTaxonomy = ({ category, collection, name, description, allowInfer = true } = {}) => {
  const normalizedCategory = normalizeCategory(category)
    || (allowInfer ? inferCategoryFromText({ category, name, description }) : null);

  if (!normalizedCategory) {
    return {
      valid: false,
      message: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}.`,
    };
  }

  // Support comma-separated multi-collection values (e.g. "Denim,Unisex").
  const rawCollection = String(collection || '').trim();
  if (rawCollection) {
    const parts = rawCollection.split(',').map((c) => c.trim()).filter(Boolean);
    const validatedParts = parts.map((part) => normalizeCollection(part)).filter(Boolean);

    if (validatedParts.length > 0) {
      // Ensure we have at least one material and one gender collection.
      const hasMaterial = validatedParts.some((c) => MATERIAL_COLLECTIONS.includes(c));
      const hasGender = validatedParts.some((c) => GENDER_COLLECTIONS.includes(c));

      const finalParts = [...validatedParts];

      // Auto-fill material from category default if missing.
      if (!hasMaterial) {
        const materialFallback = resolveCollectionFromCategory(normalizedCategory);
        if (materialFallback) {
          finalParts.unshift(materialFallback);
        }
      }

      // Auto-fill gender as Unisex if missing.
      if (!hasGender) {
        finalParts.push('Unisex');
      }

      return {
        valid: true,
        category: normalizedCategory,
        collection: finalParts.join(','),
      };
    }
  }

  // Fall back to the material-based default for the category + Unisex.
  const fallback = resolveCollectionFromCategory(normalizedCategory);

  return {
    valid: true,
    category: normalizedCategory,
    collection: fallback ? `${fallback},Unisex` : 'Denim,Unisex',
  };
};

const isValidCategory = (value) => Boolean(normalizeCategory(value));
const isValidCollection = (value) => Boolean(normalizeCollection(value));

module.exports = {
  PRODUCT_CATEGORIES,
  PRODUCT_COLLECTIONS,
  MATERIAL_COLLECTIONS,
  GENDER_COLLECTIONS,
  CATEGORY_TO_COLLECTION,
  normalizeCategory,
  normalizeCollection,
  inferCategoryFromText,
  resolveCollectionFromCategory,
  resolveProductTaxonomy,
  isValidCategory,
  isValidCollection,
};
