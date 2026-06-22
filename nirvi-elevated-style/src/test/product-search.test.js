import { describe, expect, it } from 'vitest';
import { filterProducts, products } from '@/data/products';

describe('filterProducts', () => {
  it('returns the full list when the query is empty', () => {
    expect(filterProducts(products, { query: '' })).toHaveLength(products.length);
  });

  it('matches product names case-insensitively', () => {
    const results = filterProducts(products, { query: 'tote' });

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (product) =>
          product.name.toLowerCase().includes('tote') ||
          product.description.toLowerCase().includes('tote') ||
          product.category.toLowerCase().includes('tote') ||
          product.collection.toLowerCase().includes('tote'),
      ),
    ).toBe(true);
  });

  it('matches descriptions and respects the active category', () => {
    const results = filterProducts(products, { category: 'keychains', query: 'gift' });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('ARTISAN KEYCHAIN SET');
  });

  it('returns no matches when nothing matches the search term', () => {
    expect(filterProducts(products, { query: 'nonexistent product' })).toEqual([]);
  });

  it('supports collection-only filtering', () => {
    const results = filterProducts(products, { collection: 'Flex' });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.collection === 'Flex')).toBe(true);
  });

  it('returns no matches for incompatible category and collection filters', () => {
    expect(filterProducts(products, { category: 'caps', collection: 'Wool' })).toEqual([]);
  });
});
