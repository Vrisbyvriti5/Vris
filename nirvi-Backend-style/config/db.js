const mysql = require('mysql2/promise');
require('dotenv').config();

// ── Connection Pool ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vris_ecommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// ── Health check helper ──────────────────────────────────────────────────────
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅  MySQL connected successfully');

    try {
      // 1. Add discount_amount if not exists
      const [cols1] = await connection.query(`SHOW COLUMNS FROM vris_coupons LIKE 'discount_amount'`);
      if (cols1.length === 0) {
        await connection.query(`ALTER TABLE vris_coupons ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER discount_percent`);
        console.log('✅ Added discount_amount column to vris_coupons table');
      }

      // 2. Add is_first_order_only if not exists
      const [cols2] = await connection.query(`SHOW COLUMNS FROM vris_coupons LIKE 'is_first_order_only'`);
      if (cols2.length === 0) {
        await connection.query(`ALTER TABLE vris_coupons ADD COLUMN is_first_order_only BOOLEAN DEFAULT FALSE AFTER min_order_amount`);
        console.log('✅ Added is_first_order_only column to vris_coupons table');
      }

      // 3. Insert or update VRIS300 coupon
      await connection.query(`
        INSERT INTO vris_coupons (code, discount_percent, discount_amount, min_order_amount, is_first_order_only, expiry_date, is_active)
        VALUES ('VRIS300', 0, 300.00, 1299.00, TRUE, '2026-12-31 23:59:59', TRUE)
        ON DUPLICATE KEY UPDATE 
          discount_percent = 0, 
          discount_amount = 300.00, 
          min_order_amount = 1299.00, 
          is_first_order_only = TRUE, 
          is_active = TRUE
      `);
      console.log('✅ Inserted/Updated VRIS300 coupon');

      // 4. Add is_plus_member if not exists
      const [cols3] = await connection.query(`SHOW COLUMNS FROM vris_users LIKE 'is_plus_member'`);
      if (cols3.length === 0) {
        await connection.query(`ALTER TABLE vris_users ADD COLUMN is_plus_member BOOLEAN DEFAULT FALSE`);
        console.log('✅ Added is_plus_member column to vris_users table');
      }

    } catch (migErr) {
      console.error('⚠️  Migration failed:', migErr.message);
    }

    connection.release();
  } catch (error) {
    console.error('❌  MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
