// src/pages/organizer/ChangePassword.jsx
// Pantalla obligatoria al primer ingreso del organizador.
// El sistema detecta must_change_password=true y redirige acá antes
// de dejar entrar al dashboard.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { changePassword } from '../../api'

export default function ChangePassword() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.current_password) errs.current_password = 'Ingresá tu contraseña actual'
    if (!form.new_password) errs.new_password = 'Ingresá la nueva contraseña'
    else if (form.new_password.length < 8) errs.new_password = 'Mínimo 8 caracteres'
    else if (!/[A-Z]/.test(form.new_password)) errs.new_password = 'Debe tener al menos una mayúscula'
    else if (!/[0-9]/.test(form.new_password)) errs.new_password = 'Debe tener al menos un número'
    if (form.new_password !== form.new_password_confirm) errs.new_password_confirm = 'Las contraseñas no coinciden'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length > 0) { setErrors(ve); return }

    setLoading(true)
    try {
      await changePassword(form.current_password, form.new_password)
      setSuccess(true)
      // Actualizamos el user en localStorage para que must_change_password sea false
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
      savedUser.must_change_password = false
      localStorage.setItem('user', JSON.stringify(savedUser))
      // Redirigimos al dashboard después de 2 segundos
      setTimeout(() => navigate('/organizer/dashboard'), 2000)
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Error al cambiar la contraseña' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🎟️</span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            Ticketera<span className="text-brand-500">RN</span>
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">

          {success ? (
            /* Pantalla de éxito */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">¡Contraseña actualizada!</h2>
              <p className="text-sm text-gray-400">Redirigiendo al panel...</p>
            </div>
          ) : (
            <>
              {/* Aviso de contraseña temporal */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900 rounded-xl p-4 mb-5">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                  🔐 Primer ingreso
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Estás usando una contraseña temporal. Por seguridad, necesitás crear una contraseña personal antes de continuar.
                </p>
              </div>

              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Crear nueva contraseña</h2>
              <p className="text-xs text-gray-400 mb-5">Hola <strong>{user?.name}</strong>, elegí una contraseña segura.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Contraseña temporal (actual)
                  </label>
                  <input
                    name="current_password"
                    type="password"
                    value={form.current_password}
                    onChange={handleChange}
                    placeholder="Tu contraseña temporal"
                    className="input-field"
                    autoComplete="current-password"
                  />
                  {errors.current_password && <p className="text-xs text-red-500 mt-1">{errors.current_password}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    name="new_password"
                    type="password"
                    value={form.new_password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="input-field"
                    autoComplete="new-password"
                  />
                  {errors.new_password && <p className="text-xs text-red-500 mt-1">{errors.new_password}</p>}
                  {/* Indicador de seguridad */}
                  {form.new_password && (
                    <div className="mt-2 space-y-1">
                      {[
                        { ok: form.new_password.length >= 8, label: 'Mínimo 8 caracteres' },
                        { ok: /[A-Z]/.test(form.new_password), label: 'Al menos una mayúscula' },
                        { ok: /[0-9]/.test(form.new_password), label: 'Al menos un número' },
                      ].map(({ ok, label }) => (
                        <p key={label} className={`text-xs flex items-center gap-1.5 ${ok ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}>
                          {ok ? '✓' : '○'} {label}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    name="new_password_confirm"
                    type="password"
                    value={form.new_password_confirm}
                    onChange={handleChange}
                    placeholder="Repetí la nueva contraseña"
                    className="input-field"
                    autoComplete="new-password"
                  />
                  {errors.new_password_confirm && <p className="text-xs text-red-500 mt-1">{errors.new_password_confirm}</p>}
                </div>

                {errors.general && <p className="text-xs text-red-500 text-center">{errors.general}</p>}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
              </form>

              <button
                onClick={() => { logout(); navigate('/organizer/login') }}
                className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-center"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
