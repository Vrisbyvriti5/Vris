const express = require('express');
const router = express.Router();
const {
  placeOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// All order routes require authentication
router.use(authenticate);

// ── Admin Routes (must be BEFORE parameterised routes) ───────────────────────
router.get('/all', authorizeAdmin, getAllOrders);
router.put('/:id/status', authorizeAdmin, updateOrderStatus);

// ── User Routes ──────────────────────────────────────────────────────────────
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/', placeOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
