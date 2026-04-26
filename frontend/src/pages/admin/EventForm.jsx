// src/pages/admin/EventForm.jsx
// Formulario crear/editar eventos — con dark mode y responsive.

import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getEvent, createEvent, updateEvent } from '../../api'

const CATEGORIES = ['Teatro', 'Música', 'Danza', 'Arte', 'Privado', 'Otro']
const EMOJIS = ['🎭', '🎵', '🎷', '💃', '🎊', '🖼️', '🎤', '🎬', '🏆', '🎪']
const EMPTY_FORM = { title: '', description: '', date: '', location: '', category: 'Teatro', image_emoji: '🎭', image_bg: '#E1F5EE', total_capacity: '', status: 'draft', ticket_types: [{ id: Date.now(), name: 'General', price: '', available: '' }] }

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(isEditing)

  useEffect(() => {
    if (!isEditing) return
    getEvent(id).then(ev => setForm({ ...ev, date: ev.date.slice(0, 16) })).catch(() => navigate('/admin')).finally(() => setLoadingEvent(false))
  }, [id, isEditing])

  const handleChange = e => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' })) }
  const addTicketType = () => setForm(prev => ({ ...prev, ticket_types: [...prev.ticket_types, { id: Date.now(), name: '', price: '', available: '' }] }))
  const removeTicketType = i => setForm(prev => ({ ...prev, ticket_types: prev.ticket_types.filter((_, idx) => idx !== i) }))
  const updateTicketType = (i, field, value) => setForm(prev => ({ ...prev, ticket_types: prev.ticket_types.map((tt, idx) => idx === i ? { ...tt, [field]: value } : tt) }))

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'El título es obligatorio'
    if (!form.date) errs.date = 'La fecha es obligatoria'
    if (!form.location.trim()) errs.location = 'El lugar es obligatorio'
    if (!form.total_capacity || Number(form.total_capacity) <= 0) errs.total_capacity = 'Ingresá la capacidad'
    if (form.ticket_types.length === 0) errs.ticket_types = 'Agregá al menos un tipo'
    form.ticket_types.forEach((tt, i) => {
      if (!tt.name.trim()) errs[`tt_name_${i}`] = 'Nombre requerido'
      if (tt.price === '' || Number(tt.price) < 0) errs[`tt_price_${i}`] = 'Precio requerido'
      if (!tt.available || Number(tt.available) <= 0) errs[`tt_avail_${i}`] = 'Cantidad requerida'
    })
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length > 0) { setErrors(ve); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const payload = { ...form, total_capacity: Number(form.total_capacity), available_tickets: Number(form.total_capacity), ticket_types: form.ticket_types.map(tt => ({ ...tt, price: Number(tt.price), available: Number(tt.available) })) }
    setLoading(true)
    try { isEditing ? await updateEvent(id, payload) : await createEvent(payload); navigate('/admin') }
    catch { setErrors({ general: 'Error al guardar. Intentá de nuevo.' }) }
    finally { setLoading(false) }
  }

  if (loadingEvent) return <div className="min-h-screen dark:bg-gray-950 flex items-center justify-center text-gray-400">Cargando...</div>

  const SectionCard = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">{title}</h2>
      {children}
    </div>
  )
  const Label = ({ children }) => <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{children}</label>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <Link to="/admin" className="font-semibold text-gray-900 dark:text-white">🎟️ TicketeraRN</Link>
        <span className="text-sm text-gray-500 dark:text-gray-400">{isEditing ? 'Editar evento' : 'Nuevo evento'}</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Volver</Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Editar evento' : 'Crear nuevo evento'}</h1>
        </div>

        {errors.general && <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl p-4 mb-6">{errors.general}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <SectionCard title="Información básica">
            <div className="space-y-4">
              <div>
                <Label>Título del evento *</Label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Ej: La Casa de Bernarda Alba" className="input-field" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <Label>Descripción</Label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describí el evento..." rows={4} className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y hora *</Label>
                  <input name="date" type="datetime-local" value={form.date} onChange={handleChange} className="input-field" />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <Label>Categoría</Label>
                  <select name="category" value={form.category} onChange={handleChange} className="input-field">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
              </div>
              <div>
                <Label>Lugar *</Label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="Ej: Teatro Municipal, Bariloche" className="input-field" />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Capacidad total *</Label>
                  <input name="total_capacity" type="number" min="1" value={form.total_capacity} onChange={handleChange} placeholder="200" className="input-field" />
                  {errors.total_capacity && <p className="text-xs text-red-500 mt-1">{errors.total_capacity}</p>}
                </div>
                <div>
                  <Label>Estado</Label>
                  <select name="status" value={form.status} onChange={handleChange} className="input-field">
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Ícono del evento">
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(emoji => (
                <button key={emoji} type="button" onClick={() => setForm(prev => ({ ...prev, image_emoji: emoji }))}
                  className={`w-10 h-10 text-xl rounded-xl border transition-all ${form.image_emoji === emoji ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Tipos de entrada">
            <div className="flex items-center justify-between mb-4">
              <div />
              <button type="button" onClick={addTicketType} className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">+ Agregar tipo</button>
            </div>
            {errors.ticket_types && <p className="text-xs text-red-500 mb-3">{errors.ticket_types}</p>}
            <div className="space-y-3">
              {form.ticket_types.map((tt, index) => (
                <div key={tt.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label>Nombre *</Label>
                      <input value={tt.name} onChange={e => updateTicketType(index, 'name', e.target.value)} placeholder="Ej: Platea" className="input-field text-sm" />
                      {errors[`tt_name_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`tt_name_${index}`]}</p>}
                    </div>
                    <div>
                      <Label>Precio (ARS) *</Label>
                      <input type="number" min="0" value={tt.price} onChange={e => updateTicketType(index, 'price', e.target.value)} placeholder="0 = gratis" className="input-field text-sm" />
                      {errors[`tt_price_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`tt_price_${index}`]}</p>}
                    </div>
                    <div>
                      <Label>Cantidad *</Label>
                      <input type="number" min="1" value={tt.available} onChange={e => updateTicketType(index, 'available', e.target.value)} placeholder="100" className="input-field text-sm" />
                      {errors[`tt_avail_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`tt_avail_${index}`]}</p>}
                    </div>
                  </div>
                  {form.ticket_types.length > 1 && (
                    <button type="button" onClick={() => removeTicketType(index)} className="text-xs text-red-400 hover:text-red-600 mt-2">Eliminar este tipo</button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <Link to="/admin" className="btn-secondary flex-1 text-center text-sm">Cancelar</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
