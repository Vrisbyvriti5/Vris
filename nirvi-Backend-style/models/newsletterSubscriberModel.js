const { pool } = require('../config/db');

const findByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT * FROM vris_newsletter_subscribers WHERE LOWER(TRIM(email)) = ? LIMIT 1',
    [normalizedEmail],
  );

  return rows[0] || null;
};

const create = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const [result] = await pool.query(
    'INSERT INTO vris_newsletter_subscribers (email) VALUES (?)',
    [normalizedEmail],
  );

  const [rows] = await pool.query(
    'SELECT * FROM vris_newsletter_subscribers WHERE id = ? LIMIT 1',
    [result.insertId],
  );

  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.query(
    `SELECT *
     FROM vris_newsletter_subscribers
     ORDER BY created_at DESC`,
  );

  return rows;
};

module.exports = {
  findByEmail,
  create,
  findAll,
};
