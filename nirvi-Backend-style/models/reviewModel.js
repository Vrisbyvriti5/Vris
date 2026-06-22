const { pool } = require('../config/db');

const normalizeReviewRow = (row) => ({
  id: String(row.id),
  productId: String(row.product_id),
  userId: String(row.user_id),
  userName: row.user_name,
  rating: Number(row.rating),
  comment: row.comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findByProductId = async (productId) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS user_name
     FROM vris_reviews r
     JOIN vris_users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.updated_at DESC, r.created_at DESC`,
    [productId],
  );

  return rows.map(normalizeReviewRow);
};

const findByProductAndUser = async (productId, userId) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS user_name
     FROM vris_reviews r
     JOIN vris_users u ON u.id = r.user_id
     WHERE r.product_id = ? AND r.user_id = ?
     LIMIT 1`,
    [productId, userId],
  );

  return rows[0] ? normalizeReviewRow(rows[0]) : null;
};

const findById = async (reviewId) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS user_name
     FROM vris_reviews r
     JOIN vris_users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [reviewId]
  );
  return rows[0] ? normalizeReviewRow(rows[0]) : null;
};

const upsert = async ({ productId, userId, rating, comment }) => {
  await pool.query(
    `INSERT INTO vris_reviews (product_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       rating = VALUES(rating),
       comment = VALUES(comment),
       updated_at = CURRENT_TIMESTAMP`,
    [productId, userId, rating, comment],
  );

  return findByProductAndUser(productId, userId);
};

const insert = async ({ productId, userId, rating, comment }) => {
  try {
    // Attempt to drop the unique index to allow multiple reviews if it hasn't been dropped yet
    await pool.query('ALTER TABLE vris_reviews DROP INDEX unique_product_user_review');
  } catch (err) {
    // Ignore error if index doesn't exist
  }

  const [result] = await pool.query(
    `INSERT INTO vris_reviews (product_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)`,
    [productId, userId, rating, comment]
  );

  return findById(result.insertId);
};

const update = async (reviewId, userId, { rating, comment }) => {
  const [result] = await pool.query(
    `UPDATE vris_reviews
     SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [rating, comment, reviewId, userId]
  );

  if (result.affectedRows === 0) return null;
  return findById(reviewId);
};

const getSummaryByProductId = async (productId) => {
  const [rows] = await pool.query(
    `SELECT
       COALESCE(ROUND(AVG(rating), 1), 0) AS averageRating,
       COUNT(*) AS reviewCount
     FROM vris_reviews
     WHERE product_id = ?`,
    [productId],
  );

  return {
    averageRating: Number(rows[0]?.averageRating || 0),
    reviewCount: Number(rows[0]?.reviewCount || 0),
  };
};

const deleteByProductAndUser = async (productId, userId) => {
  const [result] = await pool.query(
    `DELETE FROM vris_reviews WHERE product_id = ? AND user_id = ?`,
    [productId, userId]
  );
  return result.affectedRows > 0;
};

const deleteByIdAndUser = async (reviewId, userId) => {
  const [result] = await pool.query(
    `DELETE FROM vris_reviews WHERE id = ? AND user_id = ?`,
    [reviewId, userId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByProductId,
  findByProductAndUser,
  findById,
  upsert,
  insert,
  update,
  getSummaryByProductId,
  deleteByProductAndUser,
  deleteByIdAndUser,
};
