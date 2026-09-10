const https = require('https');
const mysql = require('mysql2/promise');

const RAZORPAY_KEY_ID = 'rzp_live_TBl8mfZnn4bong';
const RAZORPAY_KEY_SECRET = 'OHn2LaMa159ubH0fXGa6sOUq';

function razorpayGet(path) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const options = {
      hostname: 'api.razorpay.com', path, method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const pool = mysql.createPool({
    host: 'nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com',
    port: 3306, user: 'admin', password: 'j7nfZXVWh6mK3Du', database: 'nirvi_ecommerce'
  });

  const [orders] = await pool.query('SELECT payment_id FROM vris_orders WHERE payment_id IS NOT NULL');
  const dbPaymentIds = new Set(orders.map(o => o.payment_id));

  // All time — last 90 days
  const fromTimestamp = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
  const rz = await razorpayGet(`/v1/payments?from=${fromTimestamp}&count=100`);
  const all = rz.items || [];

  console.log(`Total Razorpay payments (90 days): ${all.length}`);
  console.log(`Captured payments: ${all.filter(p => p.status === 'captured').length}`);
  console.log(`Failed payments: ${all.filter(p => p.status === 'failed').length}`);

  console.log('\n=== ALL RAZORPAY PAYMENTS ===');
  for (const p of all) {
    const inDb = dbPaymentIds.has(p.id);
    console.log(`${p.status === 'captured' ? (inDb ? '✅' : '🔴 MISSING') : '❌ FAILED'} | ${p.id} | ₹${p.amount/100} | status:${p.status} | contact:${p.contact || '—'} | email:${p.email || '—'} | ${new Date(p.created_at * 1000).toLocaleString('en-IN')}`);
  }

  await pool.end();
}

run().catch(e => console.error('ERROR:', e.message));
