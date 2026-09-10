const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com',
    port: 3306, user: 'admin', password: 'j7nfZXVWh6mK3Du', database: 'nirvi_ecommerce'
  });

  // Check what columns vris_users has
  const [cols] = await pool.query('SHOW COLUMNS FROM vris_users');
  const colNames = cols.map(c => c.Field);
  console.log('vris_users columns:', colNames.join(', '));

  // Add reward_points if missing
  if (!colNames.includes('reward_points')) {
    await pool.query('ALTER TABLE vris_users ADD COLUMN reward_points INT NOT NULL DEFAULT 0');
    console.log('Added reward_points column');
  } else {
    console.log('reward_points already exists');
  }

  // Add vris_credits if missing
  if (!colNames.includes('vris_credits')) {
    await pool.query('ALTER TABLE vris_users ADD COLUMN vris_credits INT NOT NULL DEFAULT 0');
    console.log('Added vris_credits column');
  } else {
    console.log('vris_credits already exists');
  }

  // Add referred_by if missing
  if (!colNames.includes('referred_by')) {
    await pool.query('ALTER TABLE vris_users ADD COLUMN referred_by INT NULL DEFAULT NULL');
    console.log('Added referred_by column');
  } else {
    console.log('referred_by already exists');
  }

  await pool.end();
}

migrate().catch(e => console.error('ERROR:', e.message));
