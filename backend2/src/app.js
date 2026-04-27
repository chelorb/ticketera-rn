// src/app.js
// Punto de entrada del servidor Express.
// Configura middlewares globales, rutas y manejo de errores.

require('dotenv').config()  // Carga las variables del archivo .env

const express = require('express')
const cors    = require('cors')
const routes  = require('./routes')

const app  = express()
const PORT = process.env.PORT || 3001

// ─── Middlewares globales ─────────────────────────────────────────────────────

// CORS: permite que el frontend (en otro origen) haga requests al backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Parsea el body de los requests como JSON
// limit: '10mb' para permitir imágenes en base64
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logger simple de requests (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// ─── Rutas ───────────────────────────────────────────────────────────────────

// Todas las rutas de la API tienen el prefijo /api
app.use('/api', routes)

// Ruta de health check — útil para verificar que el servidor está corriendo
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'TicketeraRN API',
    version: '1.0.0',
    time:    new Date().toISOString(),
  })
})

// ─── Manejo de errores ────────────────────────────────────────────────────────

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
})

// Error handler global — captura cualquier error no manejado
// El parámetro 'err' como primer argumento le dice a Express que es un error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  })
})

// ─── Iniciar servidor ─────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('')
  console.log('🎟️  TicketeraRN API')
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`🌐 Frontend esperado en ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`📋 Health check: http://localhost:${PORT}/health`)
  console.log('')
})

module.exports = app
