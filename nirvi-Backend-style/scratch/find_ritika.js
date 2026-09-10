const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com',
    port: 3306, user: 'admin', password: 'j7nfZXVWh6mK3Du', database: 'nirvi_ecommerce'
  });

  // Find user named Ritika
  const [users] = await pool.query(
    "SELECT id, name, email, phone, created_at FROM vris_users WHERE name LIKE '%ritika%' OR email LIKE '%ritika%'"
  );
  console.log('=== USERS MATCHING RITIKA ===');
  console.log(JSON.stringify(users, null, 2));

  if (users.length > 0) {
    for (const u of users) {
      const [orders] = await pool.query(
        'SELECT id, total_price, payment_status, payment_id, razorpay_order_id, status, created_at FROM vris_orders WHERE user_id = ? ORDER BY created_at DESC',
        [u.id]
      );
      console.log(`\n=== ORDERS FOR USER ${u.id} (${u.name} / ${u.email}) ===`);
      if (orders.length === 0) {
        console.log('NO ORDERS FOUND IN DB');
      } else {
        orders.forEach(o => console.log(`#${o.id} | ₹${o.total_price} | pay:${o.payment_status} | pay_id:${o.payment_id || 'NULL'} | rz:${o.razorpay_order_id || 'NULL'} | status:${o.status} | ${o.created_at}`));
      }
    }
  }

  // Also search in order address fields (in case she checked out with different name)
  const [addrOrders] = await pool.query(
    "SELECT o.id, o.user_id, o.total_price, o.payment_status, o.payment_id, o.razorpay_order_id, o.status, o.address_fullname, o.created_at FROM vris_orders o WHERE o.address_fullname LIKE '%ritika%' ORDER BY o.created_at DESC"
  );
  console.log('\n=== ORDERS WITH RITIKA IN ADDRESS NAME ===');
  if (addrOrders.length === 0) {
    console.log('NONE FOUND');
  } else {
    addrOrders.forEach(o => console.log(`#${o.id} | user:${o.user_id} | ₹${o.total_price} | pay:${o.payment_status} | pay_id:${o.payment_id || 'NULL'} | rz:${o.razorpay_order_id || 'NULL'} | addr:${o.address_fullname} | ${o.created_at}`));
  }

  // All orders from last 7 days to cross-check timing
  const [recent] = await pool.query(
    "SELECT o.id, u.name, u.email, o.total_price, o.payment_status, o.payment_id, o.razorpay_order_id, o.status, o.address_fullname, o.created_at FROM vris_orders o JOIN vris_users u ON u.id = o.user_id WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY o.created_at DESC"
  );
  console.log('\n=== ALL ORDERS LAST 7 DAYS ===');
  if (recent.length === 0) {
    console.log('NONE');
  } else {
    recent.forEach(o => console.log(`#${o.id} | ${o.name} (${o.email}) | ₹${o.total_price} | pay:${o.payment_status} | pay_id:${o.payment_id || 'NULL'} | addr:${o.address_fullname} | ${o.created_at}`));
  }

  await pool.end();
}

run().catch(e => console.error('ERROR:', e.message));
