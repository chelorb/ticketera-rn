// src/pages/admin/Organizers.jsx
// El admin crea y gestiona los usuarios organizadores.
// Al crear uno, el sistema (en producción) le manda un email con sus credenciales.
// Por ahora muestra la contraseña temporal en pantalla para que el admin la copie.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getOrganizers, createOrganizer, deleteOrganizer } from '../../api'

const PORTAL_URL = window.location.origin + '/organizer/login'

export default function Organizers() {
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', organization: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  // Guarda el resultado de crear un organizador para mostrar las credenciales
  const [newCredentials, setNewCredentials] = useState(null)

  useEffect(() => {
    getOrganizers().then(setOrganizers).finally(() => setLoading(false))
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio'
    if (!form.email.trim()) errs.email = 'El email es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email inválido'
    if (!form.organization.trim()) errs.organization = 'La organización es obligatoria'
    return errs
  }

  const handleCreate = async e => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length > 0) { setErrors(ve); return }
    setSaving(true)
    try {
      const result = await createOrganizer(form)
      setOrganizers(prev => [...prev, result.organizer])
      // Guardamos las credenciales para mostrarlas al admin
      setNewCredentials({ email: form.email, password: result.temp_password })
      setForm({ name: '', email: '', phone: '', organization: '' })
      setShowForm(false)
    } catch { setErrors({ general: 'Error al crear el organizador.' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar al organizador "${name}"? Sus eventos no se eliminarán.`)) return
    await deleteOrganizer(id)
    setOrganizers(prev => prev.filter(o => o.id !== id))
  }

  const copyToClipboard = (text) => navigator.clipboard.writeText(text)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <span className="font-semibold text-gray-900 dark:text-white">🎟️ TicketeraRN</span>
        <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">← Dashboard</Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Organizadores</h1>
          <button onClick={() => { setShowForm(!showForm); setNewCredentials(null) }}
            className="btn-primary text-sm">
            {showForm ? 'Cancelar' : '+ Nuevo organizador'}
          </button>
        </div>

        {/* Formulario de creación */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Crear nuevo organizador</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre completo *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Juan Pérez" className="input-field" />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@org.com" className="input-field" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Organización *</label>
                  <input name="organization" value={form.organization} onChange={handleChange} placeholder="Municipalidad de Bariloche" className="input-field" />
                  {errors.organization && <p className="text-xs text-red-500 mt-1">{errors.organization}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Teléfono</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+54 9 ..." className="input-field" />
                </div>
              </div>
              {errors.general && <p className="text-xs text-red-500">{errors.general}</p>}
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Creando...' : 'Crear organizador y generar credenciales'}
              </button>
            </form>
          </div>
        )}

        {/* Panel de credenciales generadas */}
        {newCredentials && (
          <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900 rounded-2xl p-5 mb-6">
            <h3 className="font-semibold text-brand-800 dark:text-brand-300 mb-1">✅ Organizador creado</h3>
            <p className="text-sm text-brand-700 dark:text-brand-400 mb-4">
              En producción se le enviará un email automático. Por ahora, compartile estas credenciales:
            </p>
            <div className="space-y-2 mb-4">
              {[
                { label: 'Portal de acceso', value: PORTAL_URL },
                { label: 'Email', value: newCredentials.email },
                { label: 'Contraseña temporal', value: newCredentials.password },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-2.5 border border-brand-100 dark:border-brand-900">
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(value)}
                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors">
                    Copiar
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-600 dark:text-brand-400">
              ⚠️ El organizador deberá cambiar su contraseña al primer ingreso.
            </p>
            <button onClick={() => setNewCredentials(null)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline">
              Cerrar
            </button>
          </div>
        )}

        {/* Lista de organizadores */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : organizers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">👤</p>
            <p className="text-sm">No hay organizadores creados aún</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{organizers.length} organizadores activos</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {organizers.map(org => (
                <div key={org.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                    <p className="text-xs text-gray-400">{org.organization}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{org.email} {org.phone && `· ${org.phone}`}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full">
                      Activo
                    </span>
                    <button onClick={() => handleDelete(org.id, org.name)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
