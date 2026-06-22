const {
  PRODUCT_CATEGORIES,
  PRODUCT_COLLECTIONS,
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
  await ensureColumnExists(connection, dbName, 'vris_products', 'collection', `VARCHAR(100) NOT NULL DEFAULT '${PRODUCT_COLLECTIONS[0]}'`);

  const [rows] = await connection.query(
    'SELECT id, name, description, category, collection FROM vris_products ORDER BY id ASC',
  );

  for (const row of rows) {
    const resolved = resolveProductTaxonomy({
      category: row.category,
      collection: row.collection,
      name: row.name,
      description: row.description,
      allowInfer: true,
    });

    const nextCategory = resolved.valid ? resolved.category : 'flex';
    const nextCollection = resolved.valid ? resolved.collection : 'Flex';

    await connection.query(
      `UPDATE vris_products
       SET category = ?, collection = ?
       WHERE id = ?`,
      [nextCategory, nextCollection, row.id],
    );
  }

  await connection.query(
    `ALTER TABLE vris_products
     MODIFY COLUMN category ENUM(${quoteValues(PRODUCT_CATEGORIES)}) NOT NULL`,
  );

  await connection.query(
    `ALTER TABLE vris_products
     MODIFY COLUMN collection VARCHAR(255) NOT NULL DEFAULT '${PRODUCT_COLLECTIONS[0]}'`,
  );

  console.log('✅  Product taxonomy migrated (category + collection)');

  return {
    migratedRows: rows.length,
  };
};

module.exports = {
  runProductTaxonomyMigration,
};
