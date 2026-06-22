const mysql = require('mysql2/promise');
require('dotenv').config();

const { runProductTaxonomyMigration } = require('./productTaxonomyMigration');

const DB_NAME = process.env.DB_NAME || 'vris_ecommerce';

const migrateProductTaxonomy = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  });

  try {
    const result = await runProductTaxonomyMigration({ connection, dbName: DB_NAME });
    console.log(`✅  Taxonomy migration complete. Rows processed: ${result.migratedRows}`);
  } catch (error) {
    console.error('❌  Product taxonomy migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

migrateProductTaxonomy()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
