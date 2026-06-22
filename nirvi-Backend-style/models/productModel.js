const { pool } = require('../config/db');
const {
  PRODUCT_CATEGORIES,
  resolveCollectionFromCategory,
} = require('../utils/productTaxonomy');

const clampDiscount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  if (numeric > 95) return 95;
  return Number(numeric.toFixed(2));
};

const calculateFinalPrice = (mrp, discountPercent) => {
  const safeMrp = Number(mrp);
  const safeDiscount = clampDiscount(discountPercent);

  if (!Number.isFinite(safeMrp) || safeMrp <= 0) {
    return 0;
  }

  const finalPrice = safeMrp * (1 - (safeDiscount / 100));
  return Number(finalPrice.toFixed(2));
};

const normalizePricing = (row) => {
  const fallbackPrice = Number(row.price || 0);
  const mrp = Number(row.mrp || fallbackPrice || 0);
  const discountPercent = clampDiscount(row.discount_percent || 0);
  const finalPrice = mrp > 0
    ? calculateFinalPrice(mrp, discountPercent)
    : Number(fallbackPrice.toFixed(2));

  return {
    mrp: Number(mrp.toFixed(2)),
    discountPercent,
    finalPrice,
  };
};

const normalizeProduct = (product, imageMap = new Map()) => {
  const { mrp, discountPercent, finalPrice } = normalizePricing(product);
  const galleryImages = imageMap.get(String(product.id)) || [];
  const fallbackImage = product.image || null;
  const images = galleryImages.length > 0
    ? galleryImages
    : (fallbackImage ? [fallbackImage] : []);
  const parsedStock = Number(product.stock ?? product.quantity ?? 0);
  const normalizedStock = Number.isFinite(parsedStock) ? parsedStock : 0;

  return {
    ...product,
    price: finalPrice,
    final_price: finalPrice,
    mrp,
    discount_percent: discountPercent,
    stock: normalizedStock,
    quantity: normalizedStock,
    average_rating: Number(product.average_rating || 0),
    review_count: Number(product.review_count || 0),
    images,
    image: images[0] || null,
  };
};

const fetchImagesForProducts = async (productIds, connection = pool) => {
  if (!productIds.length) {
    return new Map();
  }

  const [rows] = await connection.query(
    `SELECT product_id, image_path
     FROM vris_product_images
     WHERE product_id IN (?)
     ORDER BY product_id ASC, sort_order ASC, id ASC`,
    [productIds],
  );

  const map = new Map();
  rows.forEach((row) => {
    const key = String(row.product_id);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(row.image_path);
  });

  return map;
};

const replaceProductImages = async (connection, productId, images) => {
  await connection.query('DELETE FROM vris_product_images WHERE product_id = ?', [productId]);

  if (!images || !images.length) {
    return;
  }

  for (let index = 0; index < images.length; index += 1) {
    await connection.query(
      `INSERT INTO vris_product_images (product_id, image_path, sort_order)
       VALUES (?, ?, ?)`,
      [productId, images[index], index],
    );
  }
};

const buildProductQueryBase = () => (
  `SELECT p.*, COALESCE(r.avg_rating, 0) AS average_rating, COALESCE(r.review_count, 0) AS review_count
   FROM vris_products p
   LEFT JOIN (
     SELECT product_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
     FROM vris_reviews
     GROUP BY product_id
   ) r ON r.product_id = p.id`
);

const shuffleList = (items = []) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const interleaveRandomByCategory = (products = []) => {
  if (products.length < 3) {
    return shuffleList(products);
  }

  const buckets = new Map();

  products.forEach((product) => {
    const key = String(product.category || 'uncategorized').trim().toLowerCase() || 'uncategorized';

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }

    buckets.get(key).push(product);
  });

  const bucketEntries = Array.from(buckets.values()).map((bucket) => shuffleList(bucket));
  let activeBuckets = shuffleList(bucketEntries);
  const mixed = [];

  while (activeBuckets.length > 0) {
    const nextRound = [];

    activeBuckets.forEach((bucket) => {
      const nextProduct = bucket.pop();

      if (nextProduct) {
        mixed.push(nextProduct);
      }

      if (bucket.length > 0) {
        nextRound.push(bucket);
      }
    });

    activeBuckets = shuffleList(nextRound);
  }

  return mixed;
};

// ── Get all products (with optional category/collection/search filters) ─────
const findAll = async ({ category, collection, search, sort } = {}) => {
  let sql = buildProductQueryBase();
  const params = [];
  const conditions = [];

  if (category && category !== 'All') {
    conditions.push('p.category = ?');
    params.push(category);
  }

  // When filtering by Women or Men, also include products tagged with Unisex.
  // Collections are stored as comma-separated values (e.g. "Denim,Unisex").
  // Use LIKE on a normalized (lowercased, space-stripped) column to be robust
  // against case and whitespace inconsistencies in stored data.
  if (collection && collection !== 'All') {
    const lowerCol = collection.toLowerCase();
    if (lowerCol === 'women' || lowerCol === 'men') {
      conditions.push('(LOWER(p.collection) LIKE ? OR LOWER(p.collection) LIKE ?)');
      params.push(`%${lowerCol}%`, '%unisex%');
    } else {
      conditions.push('LOWER(p.collection) LIKE ?');
      params.push(`%${lowerCol}%`);
    }
  }

  if (search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ? OR p.collection LIKE ?)');
    const wildcard = `%${search}%`;
    params.push(wildcard, wildcard, wildcard, wildcard);
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  const requestedSort = String(sort || '').trim().toLowerCase();

  if (requestedSort === 'newest') {
    sql += ' ORDER BY p.created_at DESC';
  } else if (requestedSort === 'bestseller') {
    // Join with vris_order_items to get total units sold, highest first
    sql = `SELECT sub.*, COALESCE(sales.total_sold, 0) AS total_sold
           FROM (${sql}) AS sub
           LEFT JOIN (
             SELECT product_id, SUM(quantity) AS total_sold
             FROM vris_order_items
             GROUP BY product_id
           ) sales ON sales.product_id = sub.id
           ORDER BY total_sold DESC, sub.created_at DESC`;
  } else {
    sql += ' ORDER BY p.created_at DESC';
  }

  const [rows] = await pool.query(sql, params);
  const productIds = rows.map((row) => row.id);
  const imageMap = await fetchImagesForProducts(productIds);
  const normalizedProducts = rows.map((row) => normalizeProduct(row, imageMap));

  if (requestedSort === 'random') {
    return shuffleList(normalizedProducts);
  }

  if (requestedSort === 'diverse-random') {
    if (category && category !== 'All') {
      return shuffleList(normalizedProducts);
    }

    return interleaveRandomByCategory(normalizedProducts);
  }

  return normalizedProducts;
};

// ── Get single product by ID ─────────────────────────────────────────────────
const findById = async (id) => {
  const [rows] = await pool.query(
    `${buildProductQueryBase()} WHERE p.id = ? LIMIT 1`,
    [id],
  );

  if (!rows[0]) {
    return null;
  }

  const imageMap = await fetchImagesForProducts([rows[0].id]);
  return normalizeProduct(rows[0], imageMap);
};

const findRawById = async (connection, id) => {
  const [rows] = await connection.query('SELECT * FROM vris_products WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

// ── Create product ───────────────────────────────────────────────────────────
const create = async (data) => {
  const connection = await pool.getConnection();

  const {
    name,
    description,
    price,
    mrp,
    discount_percent,
    category,
    image,
    images,
    stock,
    sku,
    collection,
    featured,
  } = data;

  try {
    await connection.beginTransaction();

    const baseMrp = Number(mrp || 0) > 0 ? Number(mrp) : Number(price || 0);
    const discountPercent = clampDiscount(discount_percent || 0);
    const finalPrice = calculateFinalPrice(baseMrp, discountPercent);

    const gallery = Array.isArray(images)
      ? images.filter((entry) => Boolean(String(entry || '').trim()))
      : [];

    const primaryImage = gallery[0] || image || null;

    const [result] = await connection.query(
      `INSERT INTO vris_products
        (name, description, price, mrp, discount_percent, category, image, stock, sku, collection, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        finalPrice,
        Number(baseMrp.toFixed(2)),
        discountPercent,
        category,
        primaryImage,
        stock || 0,
        sku || null,
        collection || resolveCollectionFromCategory(category) || 'Denim',
        featured || false,
      ],
    );

    const finalGallery = gallery.length > 0
      ? gallery
      : (primaryImage ? [primaryImage] : []);

    await replaceProductImages(connection, result.insertId, finalGallery);

    await connection.commit();
    return findById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── Update product ───────────────────────────────────────────────────────────
const update = async (id, data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await findRawById(connection, id);
    if (!existing) {
      await connection.rollback();
      return null;
    }

  const fields = [];
  const params = [];

  const allowedFields = [
    'name', 'description', 'price', 'category', 'image',
    'stock', 'sku', 'collection', 'featured', 'mrp', 'discount_percent',
  ];

  for (const field of allowedFields) {
      if (data[field] !== undefined && field !== 'price' && field !== 'mrp' && field !== 'discount_percent') {
      fields.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

    const hasPricingInput = data.price !== undefined
      || data.mrp !== undefined
      || data.discount_percent !== undefined;

    if (hasPricingInput) {
      const currentMrp = Number(existing.mrp || existing.price || 0);
      const currentDiscount = clampDiscount(existing.discount_percent || 0);

      let nextMrp;
      let nextDiscount;

      if (data.mrp !== undefined) {
        nextMrp = Number(data.mrp);
      } else if (data.price !== undefined && data.discount_percent === undefined) {
        nextMrp = Number(data.price);
      } else {
        nextMrp = currentMrp;
      }

      if (data.discount_percent !== undefined) {
        nextDiscount = clampDiscount(data.discount_percent);
      } else if (data.price !== undefined && data.mrp === undefined) {
        nextDiscount = 0;
      } else {
        nextDiscount = currentDiscount;
      }

      const nextFinalPrice = calculateFinalPrice(nextMrp, nextDiscount);

      fields.push('mrp = ?');
      params.push(Number(nextMrp.toFixed(2)));

      fields.push('discount_percent = ?');
      params.push(nextDiscount);

      fields.push('price = ?');
      params.push(nextFinalPrice);
    }

    const hasImageArray = Array.isArray(data.images);
    const hasPrimaryImage = data.image !== undefined;

    if (hasImageArray || hasPrimaryImage) {
      const nextImages = hasImageArray
        ? data.images.filter((entry) => Boolean(String(entry || '').trim()))
        : [];

      const primaryImage = nextImages[0] || (hasPrimaryImage ? data.image : existing.image) || null;

      // Keep vris_products.image backward compatible as primary image.
      if (!fields.includes('image = ?')) {
        fields.push('image = ?');
        params.push(primaryImage);
      }

      const galleryToPersist = nextImages.length > 0
        ? nextImages
        : (primaryImage ? [primaryImage] : []);

      await replaceProductImages(connection, id, galleryToPersist);
    }

    if (fields.length) {
      params.push(id);
      await connection.query(
        `UPDATE vris_products SET ${fields.join(', ')} WHERE id = ?`,
        params,
      );
    }

    await connection.commit();
    return findById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── Delete product ───────────────────────────────────────────────────────────
const deleteById = async (id) => {
  const [result] = await pool.query('DELETE FROM vris_products WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ── Get distinct categories ──────────────────────────────────────────────────
const getCategories = async () => {
  return ['All', ...PRODUCT_CATEGORIES];
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById,
  getCategories,
};
