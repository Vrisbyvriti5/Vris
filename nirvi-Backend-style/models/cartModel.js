const { pool } = require('../config/db');

// ── Get all cart items for a user (with product details) ─────────────────────
const getByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.created_at,
            p.name, p.price, p.image, p.category, p.stock
     FROM vris_cart_items ci
     JOIN vris_products p ON ci.product_id = p.id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at DESC`,
    [userId],
  );
  return rows;
};

// ── Add item or increment quantity if already in cart ─────────────────────────
const addItem = async (userId, productId, quantity = 1) => {
  const [existing] = await pool.query(
    'SELECT id, quantity FROM vris_cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId],
  );

  if (existing.length > 0) {
    const newQty = existing[0].quantity + quantity;
    await pool.query('UPDATE vris_cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    return { id: existing[0].id, user_id: userId, product_id: productId, quantity: newQty };
  }

  const [result] = await pool.query(
    'INSERT INTO vris_cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
    [userId, productId, quantity],
  );

  return { id: result.insertId, user_id: userId, product_id: productId, quantity };
};

// ── Update item quantity ─────────────────────────────────────────────────────
const updateQuantity = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    return removeItem(userId, productId);
  }

  const [result] = await pool.query(
    'UPDATE vris_cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
    [quantity, userId, productId],
  );

  return result.affectedRows > 0;
};

// ── Remove specific item ─────────────────────────────────────────────────────
const removeItem = async (userId, productId) => {
  const [result] = await pool.query(
    'DELETE FROM vris_cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId],
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
  removeItem,
  clearCart,
};
