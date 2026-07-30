const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/agenda_zap' 
});

async function updateToken() {
  try {
    const query = `UPDATE users_admin SET abacatepay_token = 'abc_dev_3pHgwafgSrEDPw2EydHsRJBd', payment_gateway = 'ABACATEPAY'`;
    await pool.query(query);
    console.log('AbacatePay token configurado e ativado!');
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
  } finally {
    pool.end();
  }
}

updateToken();
