// src/controllers/authController.js
// Maneja el login y el cambio de contraseña.

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/database')

// POST /api/auth/login
// Verifica las credenciales y devuelve un token JWT si son correctas.
async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' })
  }

  try {
    // Buscamos el usuario en la BD por email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND status = $2',
      [email.toLowerCase().trim(), 'active']
    )

    if (result.rows.length === 0) {
      // Usamos el mismo mensaje para email y contraseña incorrectos
      // para no revelar si el email existe o no (seguridad)
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    const user = result.rows[0]

    // bcrypt.compare() verifica la contraseña contra el hash guardado
    const passwordValid = await bcrypt.compare(password, user.password_hash)
    if (!passwordValid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    // Generamos el token JWT con los datos básicos del usuario
    // El token expira según JWT_EXPIRES_IN del .env (ej: '7d' = 7 días)
    const token = jwt.sign(
      {
        id:           user.id,
        email:        user.email,
        role:         user.role,
        name:         user.name,
        organization: user.organization,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      user: {
        id:                  user.id,
        email:               user.email,
        role:                user.role,
        name:                user.name,
        organization:        user.organization,
        must_change_password: user.must_change_password,
      }
    })
  } catch (err) {
    console.error('Error en login:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/auth/change-password
// Permite al usuario cambiar su contraseña (requerido al primer ingreso).
async function changePassword(req, res) {
  const { current_password, new_password } = req.body
  const userId = req.user.id

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' })
  }

  if (new_password.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' })
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId])
    const user = result.rows[0]

    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' })
    }

    const newHash = await bcrypt.hash(new_password, 12)
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [newHash, userId]
    )

    res.json({ message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    console.error('Error al cambiar contraseña:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/auth/me
// Devuelve los datos del usuario autenticado (útil para verificar sesión)
async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, organization, must_change_password FROM users WHERE id = $1',
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { login, changePassword, me }
