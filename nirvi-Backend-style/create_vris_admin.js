const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'nirvi_ecommerce';

const adminUser = {
  name: 'VRIS Admin',
  email: 'admin@vris.com',
  password: 'Vrisadmin@2026',
  role: 'admin',
};

const createAdmin = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  });

  try {
    const [existingAdmin] = await connection.query(
      'SELECT id FROM vris_users WHERE email = ?',
      [adminUser.email],
    );

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(adminUser.password, salt);

    if (existingAdmin.length === 0) {
      await connection.query(
        'INSERT INTO vris_users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [adminUser.name, adminUser.email, hash, adminUser.role],
      );
      console.log('✅  Admin user created successfully!');
    } else {
      await connection.query(
        'UPDATE vris_users SET password = ?, role = ? WHERE email = ?',
        [hash, 'admin', adminUser.email],
      );
      console.log('✅  Admin user already existed. Updated password and ensured role is admin.');
    }
  } catch (error) {
    console.error('❌  Failed to create admin:', error.message);
  } finally {
    await connection.end();
  }
};

createAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
