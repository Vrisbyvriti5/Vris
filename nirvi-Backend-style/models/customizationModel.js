const { pool } = require('../config/db');

// ── Fetch all custom orders (admin) ──────────────────────────────────────────
const findAll = async () => {
  // Get all order items that are custom, joined with order and user info
  const [items] = await pool.query(
    `SELECT
       oi.id          AS item_id,
       oi.order_id,
       oi.product_id,
       oi.name        AS product_name,
       oi.size,
       oi.price,
       oi.quantity,
       oi.image,
       oi.custom_bust,
       oi.custom_waist,
       oi.custom_hips,
       oi.custom_length,
       oi.custom_color,
       o.status,
       o.payment_status,
       o.payment_method,
       o.created_at,
       o.address_fullname,
       o.address_mobile,
       o.address_city,
       o.address_state,
       o.address_full,
       u.name   AS user_name,
       u.email  AS user_email
     FROM vris_order_items oi
     JOIN vris_orders o ON o.id = oi.order_id
     JOIN vris_users  u ON u.id = o.user_id
     WHERE oi.is_custom = 1
     ORDER BY o.created_at DESC`,
  );

  return items;
};

// ── Fetch single customization item (by order_item id) ───────────────────────
const findById = async (itemId) => {
  const [rows] = await pool.query(
    `SELECT
       oi.id          AS item_id,
       oi.order_id,
       oi.product_id,
       oi.name        AS product_name,
       oi.size,
       oi.price,
       oi.quantity,
       oi.image,
       oi.custom_bust,
       oi.custom_waist,
       oi.custom_hips,
       oi.custom_length,
       oi.custom_color,
       o.status,
       o.payment_status,
       o.payment_method,
       o.created_at,
       o.address_fullname,
       o.address_mobile,
       o.address_city,
       o.address_state,
       o.address_full,
       u.name   AS user_name,
       u.email  AS user_email
     FROM vris_order_items oi
     JOIN vris_orders o ON o.id = oi.order_id
     JOIN vris_users  u ON u.id = o.user_id
     WHERE oi.id = ? AND oi.is_custom = 1
     LIMIT 1`,
    [itemId],
  );
  return rows[0] || null;
};

// ── Update status of the parent order ────────────────────────────────────────
// (customization status is stored as the order's status)
const updateStatus = async (orderId, status) => {
  const [result] = await pool.query(
    'UPDATE vris_orders SET status = ? WHERE id = ?',
    [status, orderId],
  );
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findById,
  updateStatus,
};
