// src/config/database.js
// Configura el pool de conexiones a PostgreSQL usando la librería 'pg'.
// Un "pool" mantiene varias conexiones abiertas y las reutiliza,
// lo que es mucho más eficiente que abrir una conexión nueva por cada request.

const { Pool } = require('pg')
require('dotenv').config()

// El Pool lee las variables de entorno del archivo .env
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'ticketera_rn',
  user:     process.env.DB_USER     || 'ticketera_user',
  password: process.env.DB_PASSWORD || 'ticketera123',
  // Máximo de conexiones simultáneas al pool
  max: 10,
  // Si una conexión lleva más de 30 seg idle, se cierra
  idleTimeoutMillis: 30000,
  // Timeout para obtener una conexión del pool
  connectionTimeoutMillis: 2000,
})

// Verificamos la conexión al iniciar
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Conectado a PostgreSQL')
  }
})

pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err.message)
})

// Exportamos el pool para usarlo en toda la app.
// En vez de hacer queries directo, usamos pool.query() o pool.connect()
module.exports = pool
