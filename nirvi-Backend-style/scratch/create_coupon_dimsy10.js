/**
 * One-off script: Create DIMSY10 coupon (10% discount) in the RDS database.
 * Uses credentials from the project .env file.
 * Run: node scratch/create_coupon_dimsy10.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:      { rejectUnauthorized: false },
  });

  console.log('✅  Connected to DB:', process.env.DB_HOST);

  const [result] = await connection.execute(
    `INSERT INTO vris_coupons
       (code, discount_percent, expiry_date, min_order_amount, is_active)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       discount_percent  = VALUES(discount_percent),
       expiry_date       = VALUES(expiry_date),
       min_order_amount  = VALUES(min_order_amount),
       is_active         = VALUES(is_active)`,
    ['DIMSY10', 10.00, '2027-12-31', 0.00, true]
  );

  console.log('✅  Coupon upserted. Affected rows:', result.affectedRows);

  // Verify
  const [rows] = await connection.execute(
    `SELECT id, code, discount_percent, expiry_date, min_order_amount, is_active
       FROM vris_coupons WHERE code = ?`,
    ['DIMSY10']
  );

  console.log('\n📋  Coupon record in DB:');
  console.table(rows);

  await connection.end();
})().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
