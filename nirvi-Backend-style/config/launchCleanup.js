/**
 * VRIS eCommerce — Launch cleanup
 *
 * Clears transactional/user-generated data so production can start fresh.
 * Keeps catalog data (products, product images, coupons) intact.
 * Uses vris_ prefixed tables.
 *
 * Usage:
 *   node config/launchCleanup.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'vris_ecommerce';
const ADMIN_EMAIL = process.env.LAUNCH_ADMIN_EMAIL || 'admin@vris.com';
const ADMIN_NAME = process.env.LAUNCH_ADMIN_NAME || 'VRIS Admin';
const ADMIN_PASSWORD = process.env.LAUNCH_ADMIN_PASSWORD || 'VRISAdmin@2026';

const TABLES_TO_TRUNCATE = [
  'vris_order_items',
  'vris_orders',
  'vris_cart_items',
  'vris_reviews',
  'vris_contact_requests',
  'vris_contact_messages',
  'vris_newsletter_subscribers',
];

const tableExists = async (connection, tableName) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DB_NAME, tableName],
  );

  return rows[0].count > 0;
};

const truncateIfExists = async (connection, tableName) => {
  if (!(await tableExists(connection, tableName))) {
    console.log(`ℹ️  Skipped missing table: ${tableName}`);
    return;
  }

  await connection.query(`TRUNCATE TABLE \`${tableName}\``);
  console.log(`✅  Cleared table: ${tableName}`);
};

const ensureAdminUser = async (connection) => {
  const [existingAdmin] = await connection.query(
    'SELECT id FROM vris_users WHERE email = ? LIMIT 1',
    [ADMIN_EMAIL],
  );

  if (existingAdmin.length === 0) {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await connection.query(
      'INSERT INTO vris_users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin'],
    );
    console.log(`✅  Created admin user: ${ADMIN_EMAIL}`);
  } else {
    await connection.query(
      'UPDATE vris_users SET role = ? WHERE email = ?',
      ['admin', ADMIN_EMAIL],
    );
    console.log(`✅  Verified admin role for: ${ADMIN_EMAIL}`);
  }
};

const cleanup = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  });

  try {
    // Clear rows from child/transactional tables first.
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tableName of TABLES_TO_TRUNCATE) {
      await truncateIfExists(connection, tableName);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    await connection.query('DROP TABLE IF EXISTS students');
    console.log('✅  Dropped legacy table if present: students');

    if (!(await tableExists(connection, 'vris_users'))) {
      throw new Error('Table "vris_users" does not exist. Run `npm run db:init` first.');
    }

    await ensureAdminUser(connection);

    const [deleteUsersResult] = await connection.query(
      'DELETE FROM vris_users WHERE email <> ?',
      [ADMIN_EMAIL],
    );
    console.log(`✅  Removed non-admin users: ${deleteUsersResult.affectedRows}`);

    // Remove any image records pointing to deleted/non-existent products.
    if (await tableExists(connection, 'vris_product_images')) {
      const [cleanupImagesResult] = await connection.query(
        `DELETE pi
         FROM vris_product_images pi
         LEFT JOIN vris_products p ON p.id = pi.product_id
         WHERE p.id IS NULL`,
      );

      console.log(`✅  Removed orphan product images: ${cleanupImagesResult.affectedRows}`);
    }

    console.log('\n🎉  Launch cleanup completed successfully!');
    console.log('ℹ️  Product samples were preserved.');
  } catch (error) {
    console.error('❌  Launch cleanup failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

cleanup()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
