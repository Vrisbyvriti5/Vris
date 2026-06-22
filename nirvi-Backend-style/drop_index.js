const { pool } = require('./config/db');

async function run() {
  try {
    console.log('Connecting to database and dropping index...');
    await pool.query('ALTER TABLE vris_reviews DROP INDEX unique_product_user_review;');
    console.log('✅ Success: Unique index dropped from vris_reviews table. Multiple reviews per user are now allowed.');
  } catch (e) {
    if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('ℹ️  Index already dropped or does not exist. You are all set!');
    } else {
      console.error('❌ Error dropping index:', e.message);
    }
  }
  process.exit(0);
}

run();
