const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected to', process.env.DB_NAME);

  // 1. Add XS to size ENUMs
  const sizeEnum = "ENUM('XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL')";
  await conn.query(`ALTER TABLE vris_product_sizes MODIFY COLUMN size ${sizeEnum} NOT NULL`);
  console.log('✅ vris_product_sizes: XS added');
  await conn.query(`ALTER TABLE vris_cart_items MODIFY COLUMN size ${sizeEnum} NULL`);
  console.log('✅ vris_cart_items: XS added');
  await conn.query(`ALTER TABLE vris_order_items MODIFY COLUMN size ${sizeEnum} NULL`);
  console.log('✅ vris_order_items: XS added');

  // 2. VRIS20 → VRIS10 (update code and discount)
  await conn.query(`UPDATE vris_coupons SET code = 'VRIS10', discount_percent = 10 WHERE code = 'VRIS20'`);
  console.log('✅ Coupon VRIS20 → VRIS10 (10%)');

  // 3. Add Indo Western to category ENUM
  const [cols] = await conn.query(`SHOW COLUMNS FROM vris_products LIKE 'category'`);
  const currentType = cols[0]?.Type || '';
  if (!currentType.includes('Indo Western')) {
    await conn.query(`ALTER TABLE vris_products MODIFY COLUMN category ENUM('Tops','Skirts','Dresses','Full Set','Indo Western') NOT NULL`);
    console.log('✅ Category ENUM: Indo Western added');
  } else {
    console.log('⏭  Indo Western already in ENUM');
  }

  await conn.end();
  console.log('\n🎉 All migrations done!');
}

migrate().catch(err => { console.error('❌', err.message); process.exit(1); });
