// src/middleware/authMiddleware.js
// Verifica que el request tenga un token JWT válido.
// Se usa como middleware en las rutas que requieren autenticación.
//
// Flujo:
// 1. El cliente envía el token en el header: Authorization: Bearer <token>
// 2. Este middleware lo lee, verifica y decodifica
// 3. Si es válido, agrega req.user con los datos del usuario y llama a next()
// 4. Si no es válido, responde con 401 (no autorizado)

const jwt = require('jsonwebtoken')

// Middleware base: verifica cualquier token válido (admin u organizer)
function authenticate(req, res, next) {
  // Leemos el header Authorization
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  // Extraemos el token (la parte después de "Bearer ")
  const token = authHeader.split(' ')[1]

  try {
    // jwt.verify() decodifica y verifica la firma del token
    // Si el token fue modificado o expiró, lanza un error
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // { id, email, role, name }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Iniciá sesión nuevamente.' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}

// Middleware adicional: solo permite admins
// Se usa después de authenticate()
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' })
  }
  next()
}

// Middleware adicional: permite admins Y organizadores
function requireOrganizer(req, res, next) {
  if (!['admin', 'organizer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  next()
}

module.exports = { authenticate, requireAdmin, requireOrganizer }
