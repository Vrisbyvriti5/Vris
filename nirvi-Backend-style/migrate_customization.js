/**
 * Migration: create customize colors table + add custom columns to order items.
 * Safe to re-run (checks for existing columns before altering).
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, table, column],
  );
  return rows.length > 0;
}

async function addColumnIfMissing(connection, table, column, definition) {
  const exists = await columnExists(connection, table, column);
  if (exists) {
    console.log(`  ⏭  Column already exists: ${table}.${column}`);
    return;
  }
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`  ✅ Added column: ${table}.${column}`);
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  console.log('✔  Connected to DB:', process.env.DB_NAME);

  try {
    // ── 1. Create customize colors table ─────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_product_customize_colors (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_name VARCHAR(64)  NOT NULL,
        color_hex  VARCHAR(16)  NOT NULL,
        sort_order INT          DEFAULT 0,
        INDEX idx_pcc_product_id (product_id)
      )
    `);
    console.log('✅ Table ready: vris_product_customize_colors');

    // ── 2. Add customization columns to vris_order_items ────────────────────
    const orderItemCols = [
      ['custom_bust',   'DECIMAL(6,2) DEFAULT NULL'],
      ['custom_waist',  'DECIMAL(6,2) DEFAULT NULL'],
      ['custom_hips',   'DECIMAL(6,2) DEFAULT NULL'],
      ['custom_length', 'DECIMAL(6,2) DEFAULT NULL'],
      ['custom_color',  'VARCHAR(64) DEFAULT NULL'],
      ['is_custom',     'TINYINT(1) DEFAULT 0'],
    ];

    for (const [col, def] of orderItemCols) {
      await addColumnIfMissing(connection, 'vris_order_items', col, def);
    }
    console.log('✅ Table ready: vris_order_items (custom* columns)');
  } finally {
    await connection.end();
    console.log('\nMigration complete ✓');
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
