const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com',
    port: 3306, user: 'admin', password: 'j7nfZXVWh6mK3Du', database: 'nirvi_ecommerce'
  });

  const USER_ID = 36;
  const PAYMENT_ID = 'pay_TZcwCdZOfhIczS';
  const RZ_ORDER_ID = 'order_TZcvqJFSzUXy5d';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create the missing order
    // Product: Nazakat (id=16), qty=1, price=4400, total=3960 (10% off VRIS10)
    const [orderResult] = await conn.query(
      `INSERT INTO vris_orders
        (user_id, total_price, delivery_charge, gift_wrap_enabled, gift_wrap_charge,
         gift_wrap_message, donation_enabled, donation_amount, status,
         payment_method, payment_status, payment_id, razorpay_order_id,
         address_fullname, address_mobile, address_pincode,
         address_city, address_state, address_full, address_landmark,
         created_at)
       VALUES (?, 3960.00, 0, 0, 0, NULL, 0, 0, 'Pending',
               'razorpay', 'Paid', ?, ?,
               'Rithika Vardhan', '9293123000', '', '', '', '', '',
               '2026-09-08 17:35:40')`,
      [USER_ID, PAYMENT_ID, RZ_ORDER_ID]
    );

    const orderId = orderResult.insertId;

    // Insert order item — Nazakat
    await conn.query(
      `INSERT INTO vris_order_items
        (order_id, product_id, name, size, price, quantity, image, is_custom)
       VALUES (?, 16, 'Nazakat', NULL, 4400.00, 1,
               'https://vrisbyvriti-assets.s3.ap-south-1.amazonaws.com/products/product-1785615299644-3dfe11f42568-DSC01920-1.webp',
               0)`,
      [orderId]
    );

    // Clear her cart
    await conn.query('DELETE FROM vris_cart_items WHERE user_id = ?', [USER_ID]);

    await conn.commit();
    console.log(`✅ Order #${orderId} created for Rithika Vardhan`);
    console.log(`   Product: Nazakat | ₹3960 | payment: ${PAYMENT_ID}`);
    console.log(`   Cart cleared.`);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  // Verify
  const [check] = await pool.query(
    'SELECT o.id, o.total_price, o.payment_status, o.payment_id, o.status FROM vris_orders o WHERE o.user_id = ?',
    [USER_ID]
  );
  console.log('\nVerification — orders for user 36:', JSON.stringify(check));

  await pool.end();
}

run().catch(e => console.error('ERROR:', e.message));
