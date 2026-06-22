const { pool } = require('../config/db');

const findByCode = async (code) => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const [rows] = await pool.query(
    `SELECT *
     FROM vris_coupons
     WHERE UPPER(TRIM(code)) = ?
     LIMIT 1`,
    [normalizedCode],
  );

  return rows[0] || null;
};

module.exports = {
  findByCode,
};
