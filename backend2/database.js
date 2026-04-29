// src/config/database.js
// Configura el pool de conexiones a PostgreSQL.
// En producción (Railway) usa la variable DATABASE_URL.
// En desarrollo usa las variables individuales del .env.

const { Pool } = require('pg')
require('dotenv').config()

let poolConfig

if (process.env.DATABASE_URL) {
  // Railway y otros servicios cloud proveen una sola URL de conexión
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    // SSL requerido en producción (Railway lo exige)
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  }
} else {
  // Desarrollo local: variables individuales del .env
  poolConfig = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 5432,
    database: process.env.DB_NAME     || 'ticketera_rn',
    user:     process.env.DB_USER     || 'ticketera_user',
    password: process.env.DB_PASSWORD || 'ticketera123',
  }
}

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Conectado a PostgreSQL')
  }
})

pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err.message)
})

module.exports = pool
