const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:cartItemId', updateCartItem);
router.delete('/clear', clearCart);
router.delete('/:cartItemId', removeFromCart);

module.exports = router;
