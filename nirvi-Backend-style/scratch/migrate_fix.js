const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Delete VRIS20 (VRIS10 already exists)
  await c.query("DELETE FROM vris_coupons WHERE code = 'VRIS20'");
  console.log('✅ Deleted VRIS20');

  // Add Indo Western to category ENUM
  const [cols] = await c.query("SHOW COLUMNS FROM vris_products LIKE 'category'");
  if (!cols[0]?.Type.includes('Indo Western')) {
    await c.query("ALTER TABLE vris_products MODIFY COLUMN category ENUM('Tops','Skirts','Dresses','Full Set','Indo Western') NOT NULL");
    console.log('✅ Indo Western category added');
  }

  // Verify
  const [coupons] = await c.query('SELECT code, discount_percent FROM vris_coupons');
  console.log('Coupons now:', coupons);

  const [cols2] = await c.query("SHOW COLUMNS FROM vris_products LIKE 'category'");
  console.log('Category ENUM:', cols2[0]?.Type);

  await c.end();
}

fix().catch(e => { console.error(e.message); process.exit(1); });
