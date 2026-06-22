const { pool } = require('../config/db');

// ── Create order + order items in a transaction ──────────────────────────────
const create = async (userId, orderData) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      items,
      totalPrice,
      deliveryCharge = 0,
      gifting = null,
      paymentMethod = 'razorpay',
      paymentStatus = 'Pending',
      paymentId = null,
      razorpayOrderId = null,
      address,
      donation = null,
    } = orderData;

    const giftWrapEnabled = Boolean(gifting?.enabled);
    const giftWrapCharge = giftWrapEnabled ? Number(gifting?.amount || 0) : 0;
    const giftWrapMessage = giftWrapEnabled ? String(gifting?.message || '').trim().slice(0, 240) : null;

    const donationEnabled = Boolean(donation?.enabled);
    const donationAmount = donationEnabled ? Number(donation?.amount || 0) : 0;

    // Insert order header
    const [orderResult] = await connection.query(
      `INSERT INTO vris_orders
        (user_id, total_price, delivery_charge, gift_wrap_enabled, gift_wrap_charge, gift_wrap_message, donation_enabled, donation_amount, status, payment_method, payment_status, payment_id, razorpay_order_id,
         address_fullname, address_mobile, address_pincode,
         address_city, address_state, address_full, address_landmark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        totalPrice,
        deliveryCharge,
        giftWrapEnabled,
        giftWrapCharge,
        giftWrapMessage,
        donationEnabled,
        donationAmount,
        paymentMethod,
        paymentStatus,
        paymentId,
        razorpayOrderId,
        address.fullName || '',
        address.mobile || '',
        address.pincode || '',
        address.city || '',
        address.state || '',
        address.fullAddress || '',
        address.landmark || '',
      ],
    );

    const orderId = orderResult.insertId;

    // Insert each order item
    for (const item of items) {
      await connection.query(
        `INSERT INTO vris_order_items (order_id, product_id, name, price, quantity, image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId || item.product_id, item.name, item.price, item.quantity, item.image || null],
      );
    }

    await connection.commit();
    return { id: orderId, userId, totalPrice, status: 'Pending', paymentStatus };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── Get orders for a specific user ───────────────────────────────────────────
const findByUserId = async (userId) => {
  const [orders] = await pool.query(
    'SELECT * FROM vris_orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );

  // Attach items for each order
  for (const order of orders) {
    const [items] = await pool.query(
      'SELECT * FROM vris_order_items WHERE order_id = ?',
      [order.id],
    );
    order.items = items;
  }

  return orders;
};

// ── Check if user has placed any orders ──────────────────────────────────────
const hasUserPlacedOrder = async (userId) => {
  const [rows] = await pool.query('SELECT 1 FROM vris_orders WHERE user_id = ? LIMIT 1', [userId]);
  return rows.length > 0;
};

// ── Get single order by ID ───────────────────────────────────────────────────
const findById = async (orderId) => {
  const [rows] = await pool.query('SELECT * FROM vris_orders WHERE id = ?', [orderId]);
  if (!rows[0]) return null;

  const order = rows[0];
  const [items] = await pool.query(
    'SELECT * FROM vris_order_items WHERE order_id = ?',
    [orderId],
  );
  order.items = items;
  return order;
};

// ── Get ALL orders (admin) ───────────────────────────────────────────────────
const findAll = async () => {
  const [orders] = await pool.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM vris_orders o
     JOIN vris_users u ON o.user_id = u.id
     ORDER BY o.created_at DESC`,
  );

  for (const order of orders) {
    const [items] = await pool.query(
      'SELECT * FROM vris_order_items WHERE order_id = ?',
      [order.id],
    );
    order.items = items;
  }

  return orders;
};

// ── Update order status ──────────────────────────────────────────────────────
const updateStatus = async (orderId, status) => {
  const [result] = await pool.query(
    'UPDATE vris_orders SET status = ? WHERE id = ?',
    [status, orderId],
  );
  return result.affectedRows > 0;
};

module.exports = {
  create,
  findByUserId,
  findById,
  findAll,
  updateStatus,
  hasUserPlacedOrder,
};
