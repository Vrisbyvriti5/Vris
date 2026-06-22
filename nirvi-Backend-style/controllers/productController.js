const ProductModel = require('../models/productModel');
const ReviewModel = require('../models/reviewModel');
const {
  PRODUCT_CATEGORIES,
  PRODUCT_COLLECTIONS,
  normalizeCategory,
  normalizeCollection,
  resolveProductTaxonomy,
} = require('../utils/productTaxonomy');
const { convertFilesToWebp } = require('../utils/imageProcessor');
const { uploadConvertedFilesToS3 } = require('../config/upload');

const parseImageUrls = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry || '').trim()).filter(Boolean);
    }
  } catch {
    // fallback for plain CSV/newline input
  }

  return String(value)
    .split(/\r?\n|,/) // support both CSV and line-separated values
    .map((entry) => entry.trim())
    .filter(Boolean);
};

/**
 * Builds the image gallery from the request.
 *
 * NEW PIPELINE:
 *   1. Collect all uploaded files from req.files (memory buffers)
 *   2. Convert each to optimized WebP using Sharp
 *   3. Upload the WebP buffers to S3
 *   4. Combine S3 URLs with any manually-entered image URLs
 *   5. Return deduplicated array
 */
const buildImageGalleryFromRequest = async (req) => {
  const rawFiles = [
    ...(req.files?.images || []),
    ...(req.files?.image || []),
  ];

  // ── Step 1: Convert all uploaded files to WebP ──────────────────────────
  let uploadedImageUrls = [];

  if (rawFiles.length > 0) {
    console.log('[Products] Processing uploaded images', {
      count: rawFiles.length,
      files: rawFiles.map((f) => ({
        name: f.originalname,
        mime: f.mimetype,
        size: `${(f.size / 1024).toFixed(1)} KB`,
      })),
    });

    // Convert all images to optimized WebP
    const convertedFiles = await convertFilesToWebp(rawFiles);

    console.log('[Products] WebP conversion complete', {
      converted: convertedFiles.length,
      totalSavings: convertedFiles.reduce((acc, f) => acc + (f.originalSize - f.optimizedSize), 0),
    });

    // Upload converted WebP buffers to S3
    uploadedImageUrls = await uploadConvertedFilesToS3(convertedFiles);

    console.log('[Products] S3 upload complete', {
      urls: uploadedImageUrls,
    });
  }

  // ── Step 2: Collect URL-based images ────────────────────────────────────
  const urlImages = [
    ...parseImageUrls(req.body?.imageUrls),
    ...parseImageUrls(req.body?.images),
  ];

  if (req.body?.image && !String(req.body.image).startsWith('[')) {
    urlImages.unshift(String(req.body.image).trim());
  }

  // ── Step 3: Deduplicate and return ──────────────────────────────────────
  const seen = new Set();
  return [...uploadedImageUrls, ...urlImages]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .filter((entry) => {
      if (seen.has(entry)) {
        return false;
      }
      seen.add(entry);
      return true;
    });
};

const normalizePriceInput = ({ price, mrp, discountPercent }) => {
  const hasMrp = mrp !== undefined && mrp !== null && String(mrp).trim() !== '';
  const hasPrice = price !== undefined && price !== null && String(price).trim() !== '';
  const normalizedMrp = hasMrp ? Number(mrp) : Number(price);
  const normalizedDiscount = discountPercent !== undefined && String(discountPercent).trim() !== ''
    ? Number(discountPercent)
    : 0;

  if (!Number.isFinite(normalizedMrp) || normalizedMrp <= 0) {
    return { valid: false, message: 'MRP/price must be a positive number.' };
  }

  if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0 || normalizedDiscount > 95) {
    return { valid: false, message: 'Discount percent must be between 0 and 95.' };
  }

  return {
    valid: true,
    hasPrice,
    mrp: normalizedMrp,
    discountPercent: normalizedDiscount,
  };
};

const calculateFinalPrice = (mrp, discountPercent) => {
  const safeMrp = Number(mrp || 0);
  const safeDiscount = Number(discountPercent || 0);
  const final = safeMrp - ((safeMrp * safeDiscount) / 100);
  return Number(Math.max(final, 0).toFixed(2));
};

const validateAndResolveTaxonomy = ({ category, collection, name, description, requireBoth = false }) => {
  const hasCategory = String(category || '').trim() !== '';
  const hasCollection = String(collection || '').trim() !== '';

  if (requireBoth && (!hasCategory || !hasCollection)) {
    return {
      valid: false,
      message: 'Category and collection are required.',
    };
  }

  const resolved = resolveProductTaxonomy({
    category,
    collection,
    name,
    description,
    allowInfer: true,
  });

  if (!resolved.valid) {
    return resolved;
  }

  return {
    valid: true,
    category: resolved.category,
    collection: resolved.collection,
  };
};

// ── Get all products ─────────────────────────────────────────────────────────
const getAllProducts = async (req, res) => {
  try {
    const { category, collection, search, sort } = req.query;

    const normalizedCategory = category && category !== 'All'
      ? normalizeCategory(category)
      : null;

    if (category && category !== 'All' && !normalizedCategory) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}.`,
      });
    }

    const normalizedCollection = collection && collection !== 'All'
      ? normalizeCollection(collection)
      : null;

    if (collection && collection !== 'All' && !normalizedCollection) {
      return res.status(400).json({
        success: false,
        message: `Collection must be one of: ${PRODUCT_COLLECTIONS.join(', ')}.`,
      });
    }

    const products = await ProductModel.findAll({
      category: normalizedCategory || 'All',
      collection: normalizedCollection || 'All',
      search,
      sort,
    });

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get single product ───────────────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Create product (admin) ───────────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      discount_percent,
      discountPercent,
      category,
      stock,
      sku,
      collection,
      featured,
    } = req.body;

    if (!name || (!price && !mrp)) {
      return res.status(400).json({
        success: false,
        message: 'Product name and MRP/price are required.',
      });
    }

    const normalizedPricing = normalizePriceInput({
      price,
      mrp,
      discountPercent: discount_percent ?? discountPercent,
    });

    if (!normalizedPricing.valid) {
      return res.status(400).json({
        success: false,
        message: normalizedPricing.message,
      });
    }

    const taxonomy = validateAndResolveTaxonomy({
      category,
      collection,
      name,
      description,
      requireBoth: false,
    });

    if (!taxonomy.valid) {
      return res.status(400).json({
        success: false,
        message: taxonomy.message,
      });
    }

    // ── Image conversion pipeline (WebP) ──────────────────────────────────
    const galleryImages = await buildImageGalleryFromRequest(req);

    const product = await ProductModel.create({
      name,
      description,
      price: normalizedPricing.hasPrice ? Number(price) : normalizedPricing.mrp,
      mrp: normalizedPricing.mrp,
      discount_percent: normalizedPricing.discountPercent,
      category: taxonomy.category,
      image: galleryImages[0] || null,
      images: galleryImages,
      stock: parseInt(stock, 10) || 0,
      sku,
      collection: taxonomy.collection,
      featured: featured === 'true' || featured === true,
    });

    res.set('Cache-Control', 'no-store');
    console.log('[Products] Created product', {
      id: product?.id,
      name: product?.name,
      mrp: product?.mrp,
      discount_percent: product?.discount_percent,
      imageCount: product?.images?.length || 0,
      imageFormat: 'webp',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'SKU already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Update product (admin) ───────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const existing = await ProductModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updateData = { ...req.body };

    console.log('[Products] Update request received', {
      id: req.params.id,
      payloadKeys: Object.keys(updateData || {}),
      imageFiles: (req.files?.images || []).length + (req.files?.image || []).length,
    });

    const hasPriceInput = updateData.price !== undefined || updateData.mrp !== undefined || updateData.discount_percent !== undefined || updateData.discountPercent !== undefined;

    if (hasPriceInput) {
      const normalizedPricing = normalizePriceInput({
        price: updateData.price ?? existing.price,
        mrp: updateData.mrp ?? existing.mrp,
        discountPercent: updateData.discount_percent ?? updateData.discountPercent ?? existing.discount_percent,
      });

      if (!normalizedPricing.valid) {
        return res.status(400).json({
          success: false,
          message: normalizedPricing.message,
        });
      }

      updateData.mrp = normalizedPricing.mrp;
      updateData.discount_percent = normalizedPricing.discountPercent;
      updateData.price = calculateFinalPrice(normalizedPricing.mrp, normalizedPricing.discountPercent);
    }

    // Parse numeric fields
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock, 10);
    if (updateData.featured !== undefined) {
      updateData.featured = updateData.featured === 'true' || updateData.featured === true;
    }
    if (updateData.discountPercent !== undefined) {
      delete updateData.discountPercent;
    }

    const taxonomy = validateAndResolveTaxonomy({
      category: updateData.category ?? existing.category,
      collection: updateData.collection ?? existing.collection,
      name: updateData.name ?? existing.name,
      description: updateData.description ?? existing.description,
      requireBoth: false,
    });

    if (!taxonomy.valid) {
      return res.status(400).json({
        success: false,
        message: taxonomy.message,
      });
    }

    updateData.category = taxonomy.category;
    updateData.collection = taxonomy.collection;

    // ── Image conversion pipeline (WebP) ──────────────────────────────────
    const galleryImages = await buildImageGalleryFromRequest(req);
    if (galleryImages.length > 0 || req.body.image === '' || req.body.imageUrls || req.body.images) {
      updateData.images = galleryImages;
      updateData.image = galleryImages[0] || null;
    }

    const product = await ProductModel.update(req.params.id, updateData);

    res.set('Cache-Control', 'no-store');
    console.log('[Products] Updated product', {
      id: product?.id,
      name: product?.name,
      mrp: product?.mrp,
      discount_percent: product?.discount_percent,
      imageCount: product?.images?.length || 0,
      imageFormat: 'webp',
    });

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Delete product (admin) ───────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const deleted = await ProductModel.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get categories ───────────────────────────────────────────────────────────
const getCategories = async (_req, res) => {
  try {
    const categories = await ProductModel.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get reviews for a product ───────────────────────────────────────────────
const getProductReviews = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const [reviews, summary] = await Promise.all([
      ReviewModel.findByProductId(req.params.id),
      ReviewModel.getSummaryByProductId(req.params.id),
    ]);

    return res.json({
      success: true,
      data: {
        productId: String(req.params.id),
        averageRating: Number(summary.averageRating || 0),
        reviewCount: Number(summary.reviewCount || 0),
        reviews,
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Add or update product review (authenticated user) ──────────────────────
const addProductReview = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    if (!comment || comment.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be at least 3 characters long.',
      });
    }

    if (comment.length > 1200) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be under 1200 characters.',
      });
    }

    const savedReview = await ReviewModel.insert({
      productId: req.params.id,
      userId: req.user.id,
      rating,
      comment,
    });

    const summary = await ReviewModel.getSummaryByProductId(req.params.id);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: {
        review: savedReview,
        averageRating: Number(summary.averageRating || 0),
        reviewCount: Number(summary.reviewCount || 0),
      },
    });
  } catch (error) {
    console.error('Add product review error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateProductReview = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!comment || comment.length < 3) {
      return res.status(400).json({ success: false, message: 'Review comment must be at least 3 characters long.' });
    }

    const updatedReview = await ReviewModel.update(req.params.reviewId, req.user.id, { rating, comment });
    if (!updatedReview) {
      return res.status(404).json({ success: false, message: 'Review not found or not authorized.' });
    }

    const summary = await ReviewModel.getSummaryByProductId(req.params.id);

    return res.json({
      success: true,
      message: 'Review updated successfully.',
      data: {
        review: updatedReview,
        averageRating: Number(summary.averageRating || 0),
        reviewCount: Number(summary.reviewCount || 0),
      },
    });
  } catch (error) {
    console.error('Update product review error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteProductReview = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const deleted = await ReviewModel.deleteByIdAndUser(req.params.reviewId, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const summary = await ReviewModel.getSummaryByProductId(req.params.id);

    return res.json({
      success: true,
      message: 'Review deleted successfully.',
      data: {
        averageRating: Number(summary.averageRating || 0),
        reviewCount: Number(summary.reviewCount || 0),
      },
    });
  } catch (error) {
    console.error('Delete product review error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
};
