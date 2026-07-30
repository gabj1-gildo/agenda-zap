const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:password@localhost:5432/agenda_zap' });
pool.query("UPDATE payment_keys SET is_active = true WHERE gateway = 'ABACATEPAY'").then(async () => {
  const res = await pool.query('SELECT id FROM appointments ORDER BY created_at DESC LIMIT 1');
  const id = res.rows[0].id;
  const response = await globalThis.fetch('http://localhost:3001/api/payments/charge', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ appointmentId: id, paymentMethod: 'pix' })
  });
  const data = await response.json();
  console.log('STATUS:', response.status);
  console.log('DATA:', data);
  pool.end();
}).catch(console.error);
