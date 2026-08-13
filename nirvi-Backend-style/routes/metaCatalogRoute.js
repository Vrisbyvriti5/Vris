/**
 * Meta Product Catalog Feeds
 *
 * GET /meta-catalog.json  — JSON format (kept for reference)
 * GET /meta-catalog.csv   — CSV format (accepted by Meta's "Data file" importer)
 *
 * Both serve the same MySQL product data. The product `id` matches the
 * `content_ids` values sent through the Meta Pixel exactly.
 *
 * Feed URLs (production):
 *   https://api.vrisbyvriti.com/meta-catalog.json
 *   https://api.vrisbyvriti.com/meta-catalog.csv
 */

const express = require('express');
const router = express.Router();
const ProductModel = require('../models/productModel');

const SITE_URL = (process.env.SITE_URL || 'https://vrisbyvriti.com').replace(/\/$/, '');
const BRAND = 'VRISBYVRITI';
const CURRENCY = 'INR';

const formatPrice = (amount) => `${Number(amount || 0).toFixed(2)} ${CURRENCY}`;
const toAvailability = (stock) => (Number(stock) > 0 ? 'in stock' : 'out of stock');
const stripHtml = (str) => String(str || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// ── Shared: fetch + map all products into feed items ─────────────────────────
const buildFeedItems = async () => {
  const products = await ProductModel.findAll({ category: 'All' });
  return products
    .filter((p) => p && p.id)
    .map((p) => ({
      id: String(p.id),
      title: String(p.name || '').trim(),
      description: stripHtml(p.description) || String(p.name || '').trim(),
      availability: toAvailability(p.stock ?? p.quantity),
      condition: 'new',
      price: formatPrice(p.final_price ?? p.price),
      link: `${SITE_URL}/product/${p.id}`,
      image_link: (Array.isArray(p.images) && p.images[0]) || p.image || '',
      brand: BRAND,
      google_product_category: 'Apparel & Accessories',
      product_type: String(p.category || '').trim(),
    }));
};

// ── CSV helper ────────────────────────────────────────────────────────────────
const CSV_COLUMNS = [
  'id', 'title', 'description', 'availability', 'condition',
  'price', 'link', 'image_link', 'brand',
  'google_product_category', 'product_type',
];

/** Wrap a field in quotes if it contains commas, quotes, or newlines. */
const csvField = (val) => {
  const s = String(val ?? '').replace(/\r\n|\r/g, '\n');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const toCSV = (items) => {
  const header = CSV_COLUMNS.join(',');
  const rows = items.map((item) => CSV_COLUMNS.map((col) => csvField(item[col])).join(','));
  return [header, ...rows].join('\r\n');
};

// ── GET /meta-catalog.json ────────────────────────────────────────────────────
router.get('/meta-catalog.json', async (_req, res) => {
  try {
    const feed = await buildFeedItems();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ data: feed });
  } catch (err) {
    console.error('[Meta Catalog JSON] Error:', err);
    res.status(500).json({ error: 'Failed to generate catalog feed.' });
  }
});

// ── GET /meta-catalog.csv ─────────────────────────────────────────────────────
router.get('/meta-catalog.csv', async (_req, res) => {
  try {
    const feed = await buildFeedItems();
    const csv = toCSV(feed);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="meta-catalog.csv"');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(csv);
  } catch (err) {
    console.error('[Meta Catalog CSV] Error:', err);
    res.status(500).send('Failed to generate catalog feed.');
  }
});

module.exports = router;
