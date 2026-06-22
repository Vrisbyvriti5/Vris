const CartModel = require('../models/cartModel');

// ── Get cart items ───────────────────────────────────────────────────────────
const getCart = async (req, res) => {
  try {
    const items = await CartModel.getByUserId(req.user.id);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({
      success: true,
      data: {
        items,
        totalItems,
        totalPrice,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Add item to cart ─────────────────────────────────────────────────────────
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    const item = await CartModel.addItem(
      req.user.id,
      productId,
      parseInt(quantity, 10) || 1,
    );

    res.status(201).json({
      success: true,
      message: 'Item added to cart.',
      data: item,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Update quantity ──────────────────────────────────────────────────────────
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required.',
      });
    }

    const updated = await CartModel.updateQuantity(
      req.user.id,
      parseInt(productId, 10),
      parseInt(quantity, 10),
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    res.json({ success: true, message: 'Cart updated.' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Remove item ──────────────────────────────────────────────────────────────
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const removed = await CartModel.removeItem(req.user.id, parseInt(productId, 10));

    if (!removed) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Clear cart ───────────────────────────────────────────────────────────────
const clearCart = async (req, res) => {
  try {
    await CartModel.clearCart(req.user.id);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
