/**
 * VRIS eCommerce — Seed the database with initial data
 *
 * Inserts the admin user and catalog products so you can start
 * testing the API immediately. Uses vris_ prefixed tables.
 *
 *   node config/seed.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const { resolveProductTaxonomy } = require('../utils/productTaxonomy');

const DB_NAME = process.env.DB_NAME || 'vris_ecommerce';
const DEFAULT_DISCOUNT_PERCENT = 20;

// ── Products (mirrors frontend catalog) ──────────────────────────────────────
const products = [
  { name: 'THE NEON VIBE TOTE', price: 380, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', category: 'totebags', description: 'A bold denim tote with neon accents. Handcrafted with premium recycled denim, featuring unique painted artwork and sturdy handles.', featured: true, stock: 18, sku: 'VRIS-0001', collection: 'Denim' },
  { name: 'POCKET GALLERY TOTE', price: 280, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', category: 'totebags', description: 'An artisanal tote featuring hand-painted pockets. Each piece is unique, crafted from upcycled denim.', featured: false, stock: 12, sku: 'VRIS-0002', collection: 'Denim' },
  { name: 'URBAN FADE FOLIO', price: 400, image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80', category: 'laptop sleeves', description: 'A sleek portfolio-style bag with a signature fade wash. Designed for creatives.', featured: true, stock: 9, sku: 'VRIS-0003', collection: 'Denim' },
  { name: 'DAISY DANGLE CHARM', price: 50, image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80', category: 'bag charms', description: 'Handmade daisy charm crafted from denim scraps.', featured: false, stock: 24, sku: 'VRIS-0004', collection: 'Wool' },
  { name: 'JOYFUL STITCH DANGLER', price: 50, image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80', category: 'bag charms', description: 'Colorful hand-stitched dangler made with love.', featured: false, stock: 30, sku: 'VRIS-0005', collection: 'Wool' },
  { name: 'UNITY BRAID BRACELET', price: 50, image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80', category: 'bracelets', description: 'Braided friendship bracelet combining denim and cotton threads.', featured: false, stock: 16, sku: 'VRIS-0006', collection: 'Wool' },
  { name: 'STREET CANVAS SNEAKERS', price: 650, image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80', category: 'flex', description: 'Custom painted canvas sneakers with denim accents.', featured: true, stock: 7, sku: 'VRIS-0007', collection: 'Flex' },
  { name: 'DENIM BUCKET HAT', price: 180, image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80', category: 'caps', description: 'Classic bucket hat reimagined in premium washed denim.', featured: false, stock: 11, sku: 'VRIS-0008', collection: 'Denim' },
  { name: 'PATCHWORK CROSSBODY', price: 320, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80', category: 'pouches', description: 'A compact crossbody bag made from carefully selected denim patches.', featured: false, stock: 15, sku: 'VRIS-0009', collection: 'Denim' },
  { name: 'FESTIVAL BRAID BRACELET', price: 60, image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80', category: 'bracelets', description: 'Festival-ready braided bracelet with metallic thread accents.', featured: false, stock: 22, sku: 'VRIS-0010', collection: 'Wool' },
  { name: 'VINTAGE WASH CAP', price: 150, image: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&q=80', category: 'caps', description: 'A vintage-inspired baseball cap with a custom wash treatment.', featured: false, stock: 14, sku: 'VRIS-0011', collection: 'Denim' },
  { name: 'THE PIND TOTE', price: 350, image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&q=80', category: 'totebags', description: 'Heritage-inspired tote bag with traditional patchwork.', featured: true, stock: 19, sku: 'VRIS-0012', collection: 'Denim' },
  { name: 'MONOCHROME TASSEL-SLEEVE', price: 250, image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&q=80', category: 'laptop sleeves', description: 'A monochrome laptop sleeve with tassel detailing.', featured: false, stock: 8, sku: 'VRIS-0013', collection: 'Denim' },
  { name: 'STEALTH STRAP SLEEVE', price: 200, image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80', category: 'laptop sleeves', description: 'Minimalist sleeve bag with a hidden magnetic strap.', featured: false, stock: 10, sku: 'VRIS-0014', collection: 'Denim' },
  { name: 'THE SQUAD SOUNDWAVE TOTE', price: 350, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80', category: 'totebags', description: 'A spacious tote featuring soundwave-inspired artwork.', featured: false, stock: 13, sku: 'VRIS-0015', collection: 'Denim' },
  { name: 'WATERLILY WASH TOTE', price: 300, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80', category: 'totebags', description: 'Delicate waterlily prints on a washed denim tote.', featured: false, stock: 17, sku: 'VRIS-0016', collection: 'Denim' },
  { name: 'DENIM SLIP-ON LOAFERS', price: 550, image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80', category: 'flex', description: 'Comfortable slip-on loafers with denim upper and cushioned insole.', featured: false, stock: 6, sku: 'VRIS-0017', collection: 'Flex' },
  { name: 'RAW EDGE BEANIE', price: 120, image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80', category: 'caps', description: 'Cozy beanie with raw edge detailing. Made from recycled denim-cotton blend.', featured: false, stock: 20, sku: 'VRIS-0018', collection: 'Denim' },
  { name: 'ARTISAN KEYCHAIN SET', price: 80, image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&q=80', category: 'keychains', description: 'Set of three handcrafted keychains with unique denim and bead detailing.', featured: false, stock: 26, sku: 'VRIS-0019', collection: 'Denim' },
  { name: 'INDIGO HIGH-TOPS', price: 720, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', category: 'flex', description: 'High-top sneakers in deep indigo denim with contrast stitching.', featured: false, stock: 5, sku: 'VRIS-0020', collection: 'Flex' },
];

const seedProducts = products.map((product) => {
  const taxonomy = resolveProductTaxonomy({
    category: product.category,
    collection: product.collection,
    name: product.name,
    description: product.description,
    allowInfer: true,
  });

  return {
    ...product,
    category: taxonomy.valid ? taxonomy.category : 'flex',
    collection: taxonomy.valid ? taxonomy.collection : 'Flex',
  };
});

const buildPricingForSeed = (finalPrice) => {
  const mrp = Number((Number(finalPrice) / (1 - (DEFAULT_DISCOUNT_PERCENT / 100))).toFixed(2));
  return {
    mrp,
    discountPercent: DEFAULT_DISCOUNT_PERCENT,
  };
};

// ── Admin credentials ────────────────────────────────────────────────────────
const adminUser = {
  name: 'VRIS Admin',
  email: 'admin@vris.com',
  password: 'VRISAdmin@2026',
  role: 'admin',
};

const seed = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  });

  try {
    // ── Seed admin user ──────────────────────────────────────────────────────
    const [existingAdmin] = await connection.query(
      'SELECT id FROM vris_users WHERE email = ?',
      [adminUser.email],
    );

    if (existingAdmin.length === 0) {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(adminUser.password, salt);

      await connection.query(
        'INSERT INTO vris_users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [adminUser.name, adminUser.email, hash, adminUser.role],
      );
      console.log('✅  Admin user created — admin@vris.com / VRISAdmin@2026');
    } else {
      await connection.query(
        'UPDATE vris_users SET role = ? WHERE email = ? AND role <> ?',
        ['admin', adminUser.email, 'admin'],
      );
      console.log('ℹ️  Admin user already exists, role verified as admin.');
    }

    // ── Seed products ────────────────────────────────────────────────────────
    const [existingProducts] = await connection.query('SELECT COUNT(*) AS count FROM vris_products');

    if (existingProducts[0].count === 0) {
      for (const product of seedProducts) {
        const pricing = buildPricingForSeed(product.price);
        await connection.query(
          `INSERT INTO vris_products (name, description, price, mrp, discount_percent, category, image, stock, sku, collection, featured)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name,
            product.description,
            product.price,
            pricing.mrp,
            pricing.discountPercent,
            product.category,
            product.image,
            product.stock,
            product.sku,
            product.collection,
            product.featured,
          ],
        );

        const [createdRows] = await connection.query('SELECT id FROM vris_products WHERE sku = ? LIMIT 1', [product.sku]);
        const productId = createdRows[0]?.id;

        if (productId && product.image) {
          await connection.query(
            `INSERT INTO vris_product_images (product_id, image_path, sort_order)
             VALUES (?, ?, 0)`,
            [productId, product.image],
          );
        }
      }
      console.log(`✅  ${seedProducts.length} products seeded.`);
    } else {
      console.log(`ℹ️  Products table already has ${existingProducts[0].count} rows, skipping.`);
    }

    console.log('ℹ️  Sample user seeding disabled for production readiness.');

    console.log('\n🎉  Database seeding completed!');
  } catch (error) {
    console.error('❌  Seeding failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
