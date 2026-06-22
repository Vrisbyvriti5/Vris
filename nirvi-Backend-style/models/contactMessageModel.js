const { pool } = require('../config/db');

const create = async ({ name, email, subject, message }) => {
  const [result] = await pool.query(
    `INSERT INTO vris_contact_messages (name, email, subject, message)
     VALUES (?, ?, ?, ?)`,
    [name, email, subject, message],
  );

  const [rows] = await pool.query(
    'SELECT * FROM vris_contact_messages WHERE id = ? LIMIT 1',
    [result.insertId],
  );

  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.query(
    `SELECT *
     FROM vris_contact_messages
     ORDER BY created_at DESC`,
  );

  return rows;
};

module.exports = {
  create,
  findAll,
};
