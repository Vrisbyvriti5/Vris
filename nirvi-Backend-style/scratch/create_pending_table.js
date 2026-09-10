const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ host: 'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com', port: 3306, user: 'admin', password: 'j7nfZXVWh6mK3Du', database: 'nirvi_ecommerce' });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vris_pending_checkouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      checkout_data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_rz_order (razorpay_order_id)
    )
  `);
  console.log('Table vris_pending_checkouts ready');
  await pool.end();
}
run().catch(e => console.error(e.message));
