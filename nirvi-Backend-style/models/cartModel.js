const { pool } = require('../config/db');

// ── Get all cart items for a user (with product details) ─────────────────────
const getByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT ci.id as cart_item_id, ci.product_id, ci.size, ci.quantity, ci.created_at,
            p.name, p.price, p.image, p.category, p.stock,
            (SELECT GROUP_CONCAT(ps.size) FROM vris_product_sizes ps WHERE ps.product_id = p.id) as available_sizes
     FROM vris_cart_items ci
     JOIN vris_products p ON ci.product_id = p.id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at DESC`,
    [userId],
  );
  return rows;
};

// ── Add item or increment quantity if already in cart ─────────────────────────
const addItem = async (userId, productId, quantity = 1, size = null) => {
  const [existing] = await pool.query(
    'SELECT id, quantity FROM vris_cart_items WHERE user_id = ? AND product_id = ? AND (size = ? OR (? IS NULL AND size IS NULL))',
    [userId, productId, size, size],
  );

  if (existing.length > 0) {
    const newQty = existing[0].quantity + quantity;
    await pool.query('UPDATE vris_cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    return { cart_item_id: existing[0].id, user_id: userId, product_id: productId, size, quantity: newQty };
  }

  const [result] = await pool.query(
    'INSERT INTO vris_cart_items (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)',
    [userId, productId, quantity, size],
  );

  return { cart_item_id: result.insertId, user_id: userId, product_id: productId, size, quantity };
};

// ── Update item quantity ─────────────────────────────────────────────────────
const updateQuantity = async (userId, cartItemId, quantity) => {
  if (quantity <= 0) {
    return removeItem(userId, cartItemId);
  }

  const [result] = await pool.query(
    'UPDATE vris_cart_items SET quantity = ? WHERE user_id = ? AND id = ?',
    [quantity, userId, cartItemId],
  );

  return result.affectedRows > 0;
};

// ── Update item size ─────────────────────────────────────────────────────────
const updateSize = async (userId, cartItemId, size) => {
  const [result] = await pool.query(
    'UPDATE vris_cart_items SET size = ? WHERE user_id = ? AND id = ?',
    [size, userId, cartItemId],
  );
  return result.affectedRows > 0;
};

// ── Remove specific item ─────────────────────────────────────────────────────
const removeItem = async (userId, cartItemId) => {
  const [result] = await pool.query(
    'DELETE FROM vris_cart_items WHERE user_id = ? AND id = ?',
    [userId, cartItemId],
  );
  return result.affectedRows > 0;
};

// ── Clear entire cart ────────────────────────────────────────────────────────
const clearCart = async (userId) => {
  await pool.query('DELETE FROM vris_cart_items WHERE user_id = ?', [userId]);
  return true;
};

module.exports = {
  getByUserId,
  addItem,
  updateQuantity,
  updateSize,
  removeItem,
  clearCart,
};
