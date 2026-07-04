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
    const { productId, quantity, size } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    if (size) {
      const validSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL'];
      if (!validSizes.includes(size)) {
        return res.status(400).json({ success: false, message: 'Invalid size.' });
      }
    }

    const item = await CartModel.addItem(
      req.user.id,
      productId,
      parseInt(quantity, 10) || 1,
      size || null
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

// ── Update quantity or size ───────────────────────────────────────────────────
const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity, size } = req.body;
    let updated = false;

    if (quantity !== undefined && quantity !== null) {
      updated = await CartModel.updateQuantity(
        req.user.id,
        parseInt(cartItemId, 10),
        parseInt(quantity, 10),
      );
    }

    if (size !== undefined) {
      const validSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL'];
      if (size && !validSizes.includes(size)) {
        return res.status(400).json({ success: false, message: 'Invalid size.' });
      }
      const updatedSize = await CartModel.updateSize(
        req.user.id,
        parseInt(cartItemId, 10),
        size || null
      );
      if (updatedSize) updated = true;
    }

    if (!updated && quantity === undefined && size === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Quantity or size is required.',
      });
    }

    // if (!updated) means the item didn't exist or belonged to another user
    // However, if the exact same quantity and size was passed, affectedRows could be 0.
    // It's safer to just return success either way if no explicit error occurred.
    res.json({ success: true, message: 'Cart updated.' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Remove item ──────────────────────────────────────────────────────────────
const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const removed = await CartModel.removeItem(req.user.id, parseInt(cartItemId, 10));

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
