/**
 * One-off script: Create DIMSY10 coupon (10% discount) in the PRODUCTION EC2 RDS database.
 * Uses credentials from deploy.sh (EC2 server .env)
 * Run: node scratch/create_coupon_dimsy10_prod.js
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host:     'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com',
  port:     3306,
  user:     'admin',
  password: 'j7nfZXVWh6mK3Du',
  database: 'nirvi_ecommerce',
  ssl:      { rejectUnauthorized: false },
};

(async () => {
  console.log('🔌  Connecting to EC2 Production DB...');
  console.log('    Host:', DB_CONFIG.host);
  console.log('    DB:  ', DB_CONFIG.database);

  const connection = await mysql.createConnection(DB_CONFIG);
  console.log('✅  Connected!\n');

  // 1. Show existing coupons before insert
  const [before] = await connection.execute(
    `SELECT id, code, discount_percent, expiry_date, min_order_amount, is_active FROM vris_coupons ORDER BY id`
  );
  console.log('📋  Existing coupons in nirvi_ecommerce:');
  console.table(before);

  // 2. Upsert DIMSY10
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
  console.log('✅  DIMSY10 upserted. Affected rows:', result.affectedRows);

  // 3. Verify
  const [rows] = await connection.execute(
    `SELECT id, code, discount_percent, expiry_date, min_order_amount, is_active
       FROM vris_coupons WHERE code = ?`,
    ['DIMSY10']
  );
  console.log('\n🎟️   DIMSY10 Coupon Record:');
  console.table(rows);

  await connection.end();
  console.log('🔒  Connection closed.');
})().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
