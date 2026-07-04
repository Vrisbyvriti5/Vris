const {
  PRODUCT_CATEGORIES,
  resolveProductTaxonomy,
} = require('../utils/productTaxonomy');

const quoteValues = (values) => values.map((value) => `'${String(value).replace(/'/g, "''")}'`).join(', ');

const ensureColumnExists = async (connection, dbName, tableName, columnName, definition) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, tableName, columnName],
  );

  if (rows[0].count > 0) {
    return;
  }

  await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  console.log(`✅  Column "${columnName}" added to "${tableName}"`);
};

const runProductTaxonomyMigration = async ({ connection, dbName }) => {
  await ensureColumnExists(connection, dbName, 'vris_products', 'category', 'VARCHAR(100) NULL');

  const [rows] = await connection.query(
    'SELECT id, name, description, category FROM vris_products ORDER BY id ASC',
  );

  for (const row of rows) {
    const resolved = resolveProductTaxonomy({
      category: row.category,
      name: row.name,
      description: row.description,
      allowInfer: true,
    });

    const nextCategory = resolved.valid ? resolved.category : PRODUCT_CATEGORIES[0];

    await connection.query(
      `UPDATE vris_products
       SET category = ?
       WHERE id = ?`,
      [nextCategory, row.id],
    );
  }

  await connection.query(
    `ALTER TABLE vris_products
     MODIFY COLUMN category ENUM(${quoteValues(PRODUCT_CATEGORIES)}) NOT NULL`,
  );

  console.log('✅  Product taxonomy migrated (category)');

  return {
    migratedRows: rows.length,
  };
};

module.exports = {
  runProductTaxonomyMigration,
};
