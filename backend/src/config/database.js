const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mayrelay',
  user: process.env.DB_USER || 'mayrelay_user',
  password: process.env.DB_PASSWORD || 'mayrelay2024',
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Erreur connexion DB:', err.message);
  } else {
    console.log('Connecte a MayRelay DB - OK');
    release();
  }
});

module.exports = pool;
