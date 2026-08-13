/**
 * Meta Product Catalog Feed
 *
 * Serves all products in Meta's required JSON format so that Meta Commerce
 * Manager can fetch and synchronise the catalog on a schedule.
 *
 * Feed URL (production): https://api.vrisbyvriti.com/meta-catalog.json
 *
 * Required fields per item (Meta spec):
 *   id, title, description, availability, condition, price, link,
 *   image_link, brand
 *
 * The `id` here must exactly match the `content_ids` values sent through
 * the Meta Pixel (both are the string of the numeric product ID from MySQL).
 */

const express = require('express');
const router = express.Router();
const ProductModel = require('../models/productModel');

// Fallback domain — override with SITE_URL env var in production
const SITE_URL = (process.env.SITE_URL || 'https://vrisbyvriti.com').replace(/\/$/, '');
const BRAND = 'VRISBYVRITI';
const CURRENCY = 'INR';

/**
 * Formats a numeric price as Meta expects: "1299.00 INR"
 */
const formatPrice = (amount) => `${Number(amount || 0).toFixed(2)} ${CURRENCY}`;

/**
 * Maps our stock value to Meta's availability string.
 */
const toAvailability = (stock) => (Number(stock) > 0 ? 'in stock' : 'out of stock');

/**
 * Strips HTML tags from a description string (Meta requires plain text).
 */
const stripHtml = (str) => String(str || '').replace(/<[^>]*>/g, '').trim();

// ── GET /meta-catalog.json ────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const products = await ProductModel.findAll({ category: 'All' });

    const feed = products
      .filter((p) => p && p.id)
      .map((p) => ({
        // ── Required fields ────────────────────────────────────────────────
        id: String(p.id),                                     // matches Pixel content_ids
        title: String(p.name || '').trim(),
        description: stripHtml(p.description) || String(p.name || '').trim(),
        availability: toAvailability(p.stock ?? p.quantity),
        condition: 'new',
        price: formatPrice(p.final_price ?? p.price),
        link: `${SITE_URL}/product/${p.id}`,
        image_link: (Array.isArray(p.images) && p.images[0]) || p.image || '',
        brand: BRAND,

        // ── Optional but strongly recommended ─────────────────────────────
        ...(p.mrp && Number(p.mrp) > Number(p.final_price ?? p.price)
          ? { sale_price: formatPrice(p.final_price ?? p.price) }
          : {}),
        google_product_category: 'Apparel & Accessories',
        product_type: String(p.category || '').trim(),
        ...(Array.isArray(p.images) && p.images.length > 1
          ? { additional_image_link: p.images.slice(1, 11).join(',') }
          : {}),
      }));

    // Cache for 1 hour — Meta re-fetches on its own schedule
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ data: feed });
  } catch (err) {
    console.error('[Meta Catalog Feed] Error:', err);
    res.status(500).json({ error: 'Failed to generate catalog feed.' });
  }
});

module.exports = router;
