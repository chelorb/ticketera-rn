// src/pages/Login.jsx
// Pantalla de login exclusiva para el administrador.
// No está en el menú principal, se accede por /login.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Completá todos los campos')
      return
    }

    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/admin') // Redirige al panel admin al loguearse
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🎟️</span>
          <h1 className="text-xl font-bold text-gray-900 mt-2">
            Ticketera<span className="text-brand-500">RN</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Panel de administración</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@ticketera.com"
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Credenciales de desarrollo visibles */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-400 text-center">
            <p className="font-medium text-gray-500 mb-1">Credenciales de prueba</p>
            <p>admin@ticketera.com</p>
            <p>Admin1234!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
