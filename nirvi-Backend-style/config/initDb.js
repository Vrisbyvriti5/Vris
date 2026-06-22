/**
 * VRIS eCommerce — Database Schema Initialisation
 *
 * Run once to create the database and all required tables.
 * All tables are prefixed with `vris_` to avoid conflicts with
 * other projects sharing the same database.
 *
 *   node config/initDb.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const { PRODUCT_CATEGORIES, PRODUCT_COLLECTIONS } = require('../utils/productTaxonomy');
const { runProductTaxonomyMigration } = require('./productTaxonomyMigration');

const DB_NAME = process.env.DB_NAME || 'vris_ecommerce';
const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const LEGACY_ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const DEFAULT_COUPONS = [
  { code: 'VRIS10', discountPercent: 10, minOrderAmount: 499, expiresInDays: 180 },
  { code: 'VRIS20', discountPercent: 20, minOrderAmount: 999, expiresInDays: 120 },
  { code: 'WELCOME15', discountPercent: 15, minOrderAmount: 699, expiresInDays: 365 },
];

const PRODUCT_CATEGORY_ENUM_SQL = PRODUCT_CATEGORIES.map((value) => `'${value}'`).join(', ');
const PRODUCT_COLLECTION_ENUM_SQL = PRODUCT_COLLECTIONS.map((value) => `'${value}'`).join(', ');

const initDatabase = async () => {
  // 1. Connect without specifying a database so we can CREATE it.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const ensureColumnExists = async (tableName, columnName, columnDefinition) => {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [DB_NAME, tableName, columnName],
    );

    if (rows[0].count === 0) {
      await connection.query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`,
      );
      console.log(`✅  Column "${columnName}" added to "${tableName}"`);
    }
  };

  const quotedValues = (values) => values.map((value) => `'${value}'`).join(', ');

  const alignOrderStatusEnum = async () => {
    await ensureColumnExists('vris_orders', 'status', `ENUM(${quotedValues(ORDER_STATUSES)}) DEFAULT 'Pending'`);

    // Step 1: temporarily allow legacy value so old rows can be migrated safely.
    await connection.query(
      `ALTER TABLE vris_orders
       MODIFY COLUMN status ENUM(${quotedValues(LEGACY_ORDER_STATUSES)}) NOT NULL DEFAULT 'Pending'`,
    );

    await connection.query(
      `UPDATE vris_orders
       SET status = 'Processing'
       WHERE status = 'Confirmed'`,
    );

    // Step 2: lock enum to the new supported workflow only.
    await connection.query(
      `ALTER TABLE vris_orders
       MODIFY COLUMN status ENUM(${quotedValues(ORDER_STATUSES)}) NOT NULL DEFAULT 'Pending'`,
    );

    console.log('✅  Order status enum aligned');
  };

  const alignProductPricing = async () => {
    await ensureColumnExists('vris_products', 'mrp', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
    await ensureColumnExists('vris_products', 'discount_percent', 'DECIMAL(5,2) NOT NULL DEFAULT 0.00');

    // Backfill new pricing columns for legacy rows.
    await connection.query(
      `UPDATE vris_products
       SET mrp = CASE
         WHEN mrp IS NULL OR mrp <= 0 THEN price
         ELSE mrp
       END`,
    );

    await connection.query(
      `UPDATE vris_products
       SET discount_percent = CASE
         WHEN discount_percent IS NULL OR discount_percent < 0 THEN 0
         WHEN discount_percent > 95 THEN 95
         ELSE discount_percent
       END`,
    );

    await connection.query(
      `UPDATE vris_products
       SET price = CASE
         WHEN mrp > 0 THEN ROUND(mrp * (1 - (discount_percent / 100)), 2)
         ELSE price
       END`,
    );

    console.log('✅  Product pricing columns aligned');
  };

  const backfillPrimaryProductImages = async () => {
    await connection.query(
      `INSERT INTO vris_product_images (product_id, image_path, sort_order)
       SELECT p.id, p.image, 0
       FROM vris_products p
       WHERE p.image IS NOT NULL
         AND TRIM(p.image) <> ''
         AND NOT EXISTS (
           SELECT 1
           FROM vris_product_images pi
           WHERE pi.product_id = p.id
         )`,
    );

    console.log('✅  Product image gallery backfilled');
  };

  const seedDefaultCoupons = async () => {
    for (const coupon of DEFAULT_COUPONS) {
      const [rows] = await connection.query('SELECT id FROM vris_coupons WHERE code = ?', [coupon.code]);

      if (rows.length > 0) {
        continue;
      }

      await connection.query(
        `INSERT INTO vris_coupons (code, discount_percent, expiry_date, min_order_amount, is_active)
         VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, TRUE)`,
        [coupon.code, coupon.discountPercent, coupon.expiresInDays, coupon.minOrderAmount],
      );
    }

    console.log('✅  Default coupons ensured');
  };

  try {
    // ── Create Database ────────────────────────────────────────────────────
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.query(`USE \`${DB_NAME}\``);
    console.log(`✅  Database "${DB_NAME}" ready`);

    // ── Users ──────────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_users (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100)  NOT NULL,
        email       VARCHAR(150)  NOT NULL UNIQUE,
        password    VARCHAR(255)  NOT NULL,
        google_id   VARCHAR(255)  UNIQUE NULL,
        role        ENUM('user', 'admin') DEFAULT 'user',
        status      ENUM('Active', 'Invited', 'Suspended') DEFAULT 'Active',
        otp         VARCHAR(6)    NULL,
        otp_expiry  DATETIME      NULL,
        reset_otp   VARCHAR(6)    NULL,
        reset_otp_expires_at DATETIME NULL,
        reset_otp_verified BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅  Table "vris_users" ready');
    await ensureColumnExists('vris_users', 'otp', 'VARCHAR(6) NULL');
    await ensureColumnExists('vris_users', 'otp_expiry', 'DATETIME NULL');
    await ensureColumnExists('vris_users', 'google_id', 'VARCHAR(255) NULL');
    await ensureColumnExists('vris_users', 'phone', 'VARCHAR(20) NULL');
    await ensureColumnExists('vris_users', 'phone_verified', 'BOOLEAN NOT NULL DEFAULT FALSE');
    await ensureColumnExists('vris_users', 'phone_otp', 'VARCHAR(6) NULL');
    await ensureColumnExists('vris_users', 'phone_otp_expires_at', 'DATETIME NULL');
    await ensureColumnExists('vris_users', 'default_address_enabled', 'BOOLEAN NOT NULL DEFAULT TRUE');
    await ensureColumnExists('vris_users', 'address_line1', 'VARCHAR(255) NULL');
    await ensureColumnExists('vris_users', 'address_line2', 'VARCHAR(255) NULL');
    await ensureColumnExists('vris_users', 'city', 'VARCHAR(100) NULL');
    await ensureColumnExists('vris_users', 'state', 'VARCHAR(100) NULL');
    await ensureColumnExists('vris_users', 'pincode', 'VARCHAR(10) NULL');
    await ensureColumnExists('vris_users', 'reset_otp', 'VARCHAR(6) NULL');
    await ensureColumnExists('vris_users', 'reset_otp_expires_at', 'DATETIME NULL');
    await ensureColumnExists('vris_users', 'reset_otp_verified', 'BOOLEAN DEFAULT FALSE');
    await ensureColumnExists('vris_users', 'dob', 'DATE NULL');
    await ensureColumnExists('vris_users', 'gender', 'ENUM(\'Male\', \'Female\', \'Other\') NULL');
    await ensureColumnExists('vris_users', 'avatar_url', 'VARCHAR(500) NULL');

    // ── Products ───────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_products (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255)  NOT NULL,
        description TEXT,
        price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        mrp         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        category    ENUM(${PRODUCT_CATEGORY_ENUM_SQL}) NOT NULL,
        image       VARCHAR(500),
        stock       INT           NOT NULL DEFAULT 0,
        sku         VARCHAR(50)   UNIQUE,
        collection  VARCHAR(255) NOT NULL DEFAULT 'Denim',
        featured    BOOLEAN       DEFAULT FALSE,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅  Table "vris_products" ready');
    await alignProductPricing();
    await runProductTaxonomyMigration({ connection, dbName: DB_NAME });

    // ── Product Images (gallery) ─────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_product_images (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        product_id  INT           NOT NULL,
        image_path  VARCHAR(500)  NOT NULL,
        sort_order  INT           NOT NULL DEFAULT 0,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES vris_products(id) ON DELETE CASCADE,
        INDEX idx_vris_product_images_product (product_id),
        INDEX idx_vris_product_images_sort (product_id, sort_order)
      )
    `);
    console.log('✅  Table "vris_product_images" ready');
    await backfillPrimaryProductImages();

    // ── Cart ───────────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_cart_items (
        id          INT  AUTO_INCREMENT PRIMARY KEY,
        user_id     INT  NOT NULL,
        product_id  INT  NOT NULL,
        quantity    INT  NOT NULL DEFAULT 1,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY  unique_user_product (user_id, product_id),
        FOREIGN KEY (user_id)    REFERENCES vris_users(id)    ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES vris_products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅  Table "vris_cart_items" ready');

    // ── Orders ─────────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_orders (
        id              INT           AUTO_INCREMENT PRIMARY KEY,
        user_id         INT           NOT NULL,
        total_price     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        gift_wrap_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
        gift_wrap_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        gift_wrap_message VARCHAR(240) NULL,
        donation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        donation_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status          ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
        payment_method  VARCHAR(50)   DEFAULT 'razorpay',
        payment_status  ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
        payment_id      VARCHAR(120)  NULL,
        razorpay_order_id VARCHAR(120) NULL,
        address_fullname   VARCHAR(150),
        address_mobile     VARCHAR(20),
        address_pincode    VARCHAR(10),
        address_city       VARCHAR(100),
        address_state      VARCHAR(100),
        address_full       TEXT,
        address_landmark   VARCHAR(255),
        created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES vris_users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅  Table "vris_orders" ready');

    await ensureColumnExists('vris_orders', 'payment_status', `ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending'`);
    await ensureColumnExists('vris_orders', 'payment_id', 'VARCHAR(120) NULL');
    await ensureColumnExists('vris_orders', 'razorpay_order_id', 'VARCHAR(120) NULL');
    await ensureColumnExists('vris_orders', 'gift_wrap_enabled', 'BOOLEAN NOT NULL DEFAULT FALSE');
    await ensureColumnExists('vris_orders', 'gift_wrap_charge', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
    await ensureColumnExists('vris_orders', 'gift_wrap_message', 'VARCHAR(240) NULL');
    await ensureColumnExists('vris_orders', 'donation_enabled', 'BOOLEAN NOT NULL DEFAULT FALSE');
    await ensureColumnExists('vris_orders', 'donation_amount', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
    await alignOrderStatusEnum();

    // ── Coupons ───────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_coupons (
        id              INT           AUTO_INCREMENT PRIMARY KEY,
        code            VARCHAR(50)   NOT NULL UNIQUE,
        discount_percent DECIMAL(5,2) NOT NULL,
        expiry_date     DATE          NOT NULL,
        min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vris_coupons_code (code),
        INDEX idx_vris_coupons_expiry (expiry_date)
      )
    `);
    console.log('✅  Table "vris_coupons" ready');
    await seedDefaultCoupons();

    // ── Reviews ───────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_reviews (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        product_id  INT           NOT NULL,
        user_id     INT           NOT NULL,
        rating      TINYINT       NOT NULL,
        comment     TEXT,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES vris_products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES vris_users(id) ON DELETE CASCADE,
        CONSTRAINT chk_vris_reviews_rating CHECK (rating >= 1 AND rating <= 5),
        UNIQUE KEY unique_product_user_review (product_id, user_id),
        INDEX idx_vris_reviews_product (product_id),
        INDEX idx_vris_reviews_user (user_id)
      )
    `);
    console.log('✅  Table "vris_reviews" ready');

    // ── Contact Requests ────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_contact_requests (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(120)  NOT NULL,
        email       VARCHAR(150)  NOT NULL,
        subject     VARCHAR(180)  NOT NULL,
        message     TEXT          NOT NULL,
        status      ENUM('New', 'In Progress', 'Resolved') DEFAULT 'New',
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vris_contact_requests_status (status),
        INDEX idx_vris_contact_requests_created_at (created_at),
        INDEX idx_vris_contact_requests_email (email)
      )
    `);
    console.log('✅  Table "vris_contact_requests" ready');
    await ensureColumnExists('vris_contact_requests', 'status', `ENUM('New', 'In Progress', 'Resolved') DEFAULT 'New'`);

    // ── Contact Messages (requested public contact form storage) ─────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_contact_messages (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(120)  NOT NULL,
        email       VARCHAR(150)  NOT NULL,
        subject     VARCHAR(180)  NOT NULL,
        message     TEXT          NOT NULL,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vris_contact_messages_created_at (created_at),
        INDEX idx_vris_contact_messages_email (email)
      )
    `);
    console.log('✅  Table "vris_contact_messages" ready');

    // ── Newsletter Subscribers ────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_newsletter_subscribers (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        email       VARCHAR(150)  NOT NULL UNIQUE,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vris_newsletter_subscribers_created_at (created_at)
      )
    `);
    console.log('✅  Table "vris_newsletter_subscribers" ready');

    // ── Order Items ────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vris_order_items (
        id          INT           AUTO_INCREMENT PRIMARY KEY,
        order_id    INT           NOT NULL,
        product_id  INT           NOT NULL,
        name        VARCHAR(255)  NOT NULL,
        price       DECIMAL(10,2) NOT NULL,
        quantity    INT           NOT NULL DEFAULT 1,
        image       VARCHAR(500),
        FOREIGN KEY (order_id)   REFERENCES vris_orders(id)   ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES vris_products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅  Table "vris_order_items" ready');

    console.log('\n🎉  All vris_* tables created successfully!');
  } catch (error) {
    console.error('❌  Database initialisation failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

// Execute when run directly
initDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
