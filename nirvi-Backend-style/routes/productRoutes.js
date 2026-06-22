const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/productController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { publicCache, noStore } = require('../middleware/cache');
const upload = require('../config/upload');

const productUploadFields = upload.fields([
  { name: 'images', maxCount: 8 },
  { name: 'image', maxCount: 1 },
]);

// ── Public Routes ────────────────────────────────────────────────────────────
router.get('/', noStore, getAllProducts);
router.get('/categories', publicCache(3600, 7200), getCategories);
router.get('/:id/reviews', noStore, getProductReviews);
router.get('/:id', noStore, getProductById);
router.post('/:id/reviews', authenticate, addProductReview);
router.put('/:id/reviews/:reviewId', authenticate, updateProductReview);
router.delete('/:id/reviews/:reviewId', authenticate, deleteProductReview);

// ── Admin-Only Routes ────────────────────────────────────────────────────────
router.post('/', authenticate, authorizeAdmin, productUploadFields, createProduct);
router.put('/:id', authenticate, authorizeAdmin, productUploadFields, updateProduct);
router.patch('/:id', authenticate, authorizeAdmin, productUploadFields, updateProduct);
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

module.exports = router;
