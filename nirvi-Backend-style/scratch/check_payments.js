const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com',
    port: 3306, user: 'admin', password: 'j7nfZXVWh6mK3Du', database: 'nirvi_ecommerce'
  });

  // All recent orders
  const [orders] = await pool.query(
    'SELECT id, user_id, total_price, payment_method, payment_status, payment_id, razorpay_order_id, status, created_at FROM vris_orders ORDER BY created_at DESC LIMIT 20'
  );
  console.log('=== RECENT 20 ORDERS ===');
  orders.forEach(o => console.log(`#${o.id} | user:${o.user_id} | ₹${o.total_price} | pay:${o.payment_status} | pay_id:${o.payment_id || 'NULL'} | status:${o.status} | ${o.created_at}`));

  // Paid but order still Pending (normal — just not fulfilled yet, but worth seeing)
  const [paidPending] = await pool.query(
    "SELECT id, user_id, total_price, payment_status, payment_id, status, created_at FROM vris_orders WHERE payment_status = 'Paid' AND status = 'Pending'"
  );
  console.log('\n=== PAID BUT ORDER STATUS = PENDING ===');
  paidPending.forEach(o => console.log(`#${o.id} | user:${o.user_id} | ₹${o.total_price} | pay_id:${o.payment_id} | ${o.created_at}`));

  // Still Pending payment (could be abandoned OR payment succeeded but order not saved)
  const [stillPending] = await pool.query(
    "SELECT id, user_id, total_price, payment_status, payment_id, razorpay_order_id, status, created_at FROM vris_orders WHERE payment_status = 'Pending' ORDER BY created_at DESC"
  );
  console.log('\n=== PAYMENT STILL PENDING (possible failed/lost orders) ===');
  stillPending.forEach(o => console.log(`#${o.id} | user:${o.user_id} | ₹${o.total_price} | rz_order:${o.razorpay_order_id || 'NULL'} | pay_id:${o.payment_id || 'NULL'} | ${o.created_at}`));

  // Users who have placed orders — cross check
  const [users] = await pool.query(
    'SELECT u.id, u.name, u.email, COUNT(o.id) as order_count FROM vris_users u LEFT JOIN vris_orders o ON o.user_id = u.id GROUP BY u.id HAVING order_count > 0 ORDER BY order_count DESC'
  );
  console.log('\n=== USERS WITH ORDERS ===');
  users.forEach(u => console.log(`user:${u.id} | ${u.name} | ${u.email} | orders:${u.order_count}`));

  await pool.end();
}

run().catch(e => console.error('ERROR:', e.message));
