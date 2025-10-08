const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// test połączenia
pool.connect()
  .then(client => {
    console.log('✅ Połączono z bazą PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('❌ Błąd połączenia z bazą:', err);
    process.exit(1);
  });

module.exports = pool;
