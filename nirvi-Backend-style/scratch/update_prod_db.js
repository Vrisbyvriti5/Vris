const mysql = require('mysql2/promise');

async function fixProdDb() {
  const c = await mysql.createConnection({
    host: 'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'j7nfZXVWh6mK3Du',
    database: 'nirvi_ecommerce',
  });
  console.log('Connected to nirvi_ecommerce');

  // 1. Add XS to size ENUMs
  const sizeEnum = "ENUM('XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL')";
  await c.query(`ALTER TABLE vris_product_sizes MODIFY COLUMN size ${sizeEnum} NOT NULL`);
  console.log('✅ vris_product_sizes: XS added');
  await c.query(`ALTER TABLE vris_cart_items MODIFY COLUMN size ${sizeEnum} NULL`);
  console.log('✅ vris_cart_items: XS added');
  await c.query(`ALTER TABLE vris_order_items MODIFY COLUMN size ${sizeEnum} NULL`);
  console.log('✅ vris_order_items: XS added');

  // 2. VRIS20 -> VRIS10
  // First, check if VRIS10 exists
  const [vris10Rows] = await c.query("SELECT * FROM vris_coupons WHERE code = 'VRIS10'");
  if (vris10Rows.length > 0) {
    // VRIS10 exists, just delete VRIS20
    await c.query("DELETE FROM vris_coupons WHERE code = 'VRIS20'");
    console.log('✅ VRIS10 already exists, deleted VRIS20');
  } else {
    // Update VRIS20 to VRIS10
    await c.query("UPDATE vris_coupons SET code = 'VRIS10', discount_percent = 10 WHERE code = 'VRIS20'");
    console.log('✅ Updated VRIS20 to VRIS10 with 10% discount');
  }

  // Ensure VRIS10 is 10% just in case
  await c.query("UPDATE vris_coupons SET discount_percent = 10 WHERE code = 'VRIS10'");

  // 3. Add Indo Western to category ENUM
  const [cols] = await c.query("SHOW COLUMNS FROM vris_products LIKE 'category'");
  if (!cols[0]?.Type.includes('Indo Western')) {
    await c.query("ALTER TABLE vris_products MODIFY COLUMN category ENUM('Tops','Skirts','Dresses','Full Set','Indo Western') NOT NULL");
    console.log('✅ Indo Western category added');
  } else {
    console.log('✅ Indo Western category already exists');
  }

  await c.end();
}

fixProdDb().catch(e => { console.error(e.message); process.exit(1); });
