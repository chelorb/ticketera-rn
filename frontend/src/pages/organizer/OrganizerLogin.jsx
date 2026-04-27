// src/pages/organizer/OrganizerLogin.jsx
// Login exclusivo para organizadores.
// URL: /organizer/login  — esta página NO está linkeada desde el sitio público.
// El admin le manda el link directamente al organizador junto con sus credenciales.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function OrganizerLogin() {
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
    if (!form.email || !form.password) { setError('Completá todos los campos'); return }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      // Si es admin que entró por acá, lo mandamos al panel admin
      if (user.role === 'admin') navigate('/admin')
      // Si es organizador, al panel del organizador
      else if (user.role === 'organizer') navigate('/organizer/dashboard')
      else setError('No tenés acceso a este panel')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <span className="text-4xl">🎟️</span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            Ticketera<span className="text-brand-500">RN</span>
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Portal de organizadores</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Acceso para organizadores</h2>
          <p className="text-xs text-gray-400 mb-5">
            Ingresá con las credenciales que te envió el administrador del sistema.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="tu@email.com" className="input-field" autoComplete="email" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Contraseña</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" className="input-field" autoComplete="current-password" />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Credenciales de prueba solo en desarrollo */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs text-gray-400 text-center">
            <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">Credencial de prueba</p>
            <p>teatro@bariloche.gob.ar</p>
            <p>Organizer1234!</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Problemas para ingresar? Contactá al administrador del sistema.
        </p>
      </div>
    </div>
  )
}
