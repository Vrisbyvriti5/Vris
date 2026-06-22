const { pool } = require('../config/db');

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM vris_contact_requests WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

const create = async ({ name, email, subject, message }) => {
  const [result] = await pool.query(
    `INSERT INTO vris_contact_requests (name, email, subject, message, status)
     VALUES (?, ?, ?, ?, 'New')`,
    [name, email, subject, message],
  );

  return findById(result.insertId);
};

const findAll = async () => {
  const [rows] = await pool.query(
    `SELECT *
     FROM vris_contact_requests
     ORDER BY created_at DESC`,
  );

  return rows;
};

const updateStatus = async (id, status) => {
  const [result] = await pool.query(
    'UPDATE vris_contact_requests SET status = ? WHERE id = ?',
    [status, id],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
};

module.exports = {
  create,
  findAll,
  updateStatus,
};
