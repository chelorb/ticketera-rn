// src/pages/organizer/OrganizerEventForm.jsx
// Formulario que usa el organizador para cargar un evento nuevo
// o corregir uno rechazado y reenviarlo a revisión.
// Al guardar, el estado queda en "pending" y le llega un aviso al admin.

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getEvent, submitEventForReview, resubmitEvent } from '../../api'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES = ['Teatro', 'Música', 'Danza', 'Arte', 'Privado', 'Otro']
const EMOJIS = ['🎭', '🎵', '🎷', '💃', '🎊', '🖼️', '🎤', '🎬', '🏆', '🎪', '🌹', '🪗']
const IMAGE_MODES = [
  { key: 'emoji',  label: '😀 Ícono' },
  { key: 'file',   label: '📁 Archivo' },
  { key: 'camera', label: '📷 Cámara' },
  { key: 'url',    label: '🔗 URL' },
]

const EMPTY_FORM = {
  title: '', description: '', date: '', location: '',
  category: 'Teatro', image_emoji: '🎭', image_bg: '#E1F5EE', image_url: '',
  ticket_types: [{ id: Date.now(), name: 'General', price: '', available: '' }]
}

// Componente de preview de imagen con selector de ajuste (igual que en admin)
function ImagePreview({ src, onClear, clearLabel = 'Cambiar', onError }) {
  const [fit, setFit] = useState('fill')
  const FIT_OPTIONS = [{ key: 'fill', label: 'Recortar' }, { key: 'fit', label: 'Completa' }, { key: 'center', label: 'Original' }]
  const objectClass = { fill: 'object-cover', fit: 'object-contain', center: 'object-none' }[fit]
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Ajuste de imagen</span>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
          {FIT_OPTIONS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setFit(key)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all ${fit === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative w-full h-56 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
        <img src={src} alt="Preview" className={`w-full h-full transition-all ${objectClass}`} onError={onError} />
        <button type="button" onClick={onClear}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white text-xs px-3 py-1.5 rounded-lg">
          {clearLabel}
        </button>
        <div className="absolute bottom-2 left-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-md">
          {fit === 'fill' ? 'Recortando bordes' : fit === 'fit' ? 'Imagen completa' : 'Tamaño original'}
        </div>
      </div>
    </div>
  )
}

export default function OrganizerEventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(isEditing)
  const [submitted, setSubmitted] = useState(false)

  // Imagen
  const [imageMode, setImageMode] = useState('emoji')
  const [imagePreview, setImagePreview] = useState('')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    getEvent(id)
      .then(ev => {
        setForm({ ...ev, date: ev.date.slice(0, 16) })
        if (ev.image_url) { setImageMode('url'); setImagePreview(ev.image_url); setImageUrlInput(ev.image_url) }
      })
      .catch(() => navigate('/organizer/dashboard'))
      .finally(() => setLoadingEvent(false))
  }, [id, isEditing])

  useEffect(() => { return () => stopCamera() }, [])

  // ── Imagen ────────────────────────────────────────────────────────────────
  const fileToBase64 = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file) })

  const handleFileChange = async e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setErrors(p => ({ ...p, image: 'Debe ser una imagen' })); return }
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, image: 'Máximo 5MB' })); return }
    const b64 = await fileToBase64(file)
    setImagePreview(b64); setForm(p => ({ ...p, image_url: b64 })); setErrors(p => ({ ...p, image: '' }))
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch { setErrors(p => ({ ...p, image: 'No se pudo acceder a la cámara.' })) }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setCameraActive(false)
  }

  const capturePhoto = () => {
    const video = videoRef.current; if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const b64 = canvas.toDataURL('image/jpeg', 0.85)
    setImagePreview(b64); setForm(p => ({ ...p, image_url: b64 })); stopCamera()
  }

  const clearImage = () => {
    setImagePreview(''); setImageUrlInput(''); setForm(p => ({ ...p, image_url: '' }))
    stopCamera(); if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleModeChange = mode => {
    clearImage(); setImageMode(mode)
    if (mode === 'camera') setTimeout(() => startCamera(), 100)
  }

  const handleUrlConfirm = () => {
    if (!imageUrlInput.trim()) return
    setImagePreview(imageUrlInput.trim()); setForm(p => ({ ...p, image_url: imageUrlInput.trim() }))
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  const handleChange = e => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); if (errors[name]) setErrors(p => ({ ...p, [name]: '' })) }
  const addTicketType = () => setForm(p => ({ ...p, ticket_types: [...p.ticket_types, { id: Date.now(), name: '', price: '', available: '' }] }))
  const removeTicketType = i => setForm(p => ({ ...p, ticket_types: p.ticket_types.filter((_, idx) => idx !== i) }))
  const updateTicketType = (i, field, value) => setForm(p => ({ ...p, ticket_types: p.ticket_types.map((tt, idx) => idx === i ? { ...tt, [field]: value } : tt) }))

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'El título es obligatorio'
    if (!form.date) errs.date = 'La fecha es obligatoria'
    if (!form.location.trim()) errs.location = 'El lugar es obligatorio'
    if (!form.description.trim()) errs.description = 'La descripción es obligatoria'
    if (form.ticket_types.length === 0) errs.ticket_types = 'Agregá al menos un tipo de entrada'
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
    const payload = {
      ...form,
      organizer_id: user.id,
      total_capacity: form.ticket_types.reduce((sum, tt) => sum + Number(tt.available), 0),
      ticket_types: form.ticket_types.map(tt => ({ ...tt, price: Number(tt.price), available: Number(tt.available) }))
    }
    setLoading(true)
    try {
      isEditing ? await resubmitEvent(id, payload) : await submitEventForReview(payload)
      setSubmitted(true)
    } catch { setErrors({ general: 'Error al enviar. Intentá de nuevo.' }) }
    finally { setLoading(false) }
  }

  const Label = ({ children }) => <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{children}</label>
  const Card = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">{title}</h2>
      {children}
    </div>
  )

  if (loadingEvent) return <div className="min-h-screen dark:bg-gray-950 flex items-center justify-center text-gray-400">Cargando...</div>

  // Pantalla de éxito post-envío
  if (submitted) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">📨</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {isEditing ? '¡Evento reenviado!' : '¡Evento enviado para revisión!'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          El administrador revisará tu evento y te notificaremos por email cuando sea aprobado o si necesita correcciones.
        </p>
        <Link to="/organizer/dashboard" className="btn-primary text-sm">
          Ver mis eventos
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <Link to="/organizer/dashboard" className="font-semibold text-gray-900 dark:text-white text-sm">
          🎟️ TicketeraRN
        </Link>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isEditing ? 'Corregir evento' : 'Nuevo evento'}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/organizer/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Volver</Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Corregir y reenviar evento' : 'Cargar nuevo evento'}
          </h1>
        </div>

        {/* Aviso informativo */}
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900 rounded-xl p-4 mb-6 text-sm text-brand-700 dark:text-brand-300">
          📋 Una vez que envíes el evento, el administrador lo revisará antes de publicarlo. Te notificaremos por email con el resultado.
        </div>

        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 text-red-600 text-sm rounded-xl p-4 mb-6">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Info básica */}
          <Card title="Información del evento">
            <div className="space-y-4">
              <div>
                <Label>Nombre del evento *</Label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Ej: Concierto de Primavera" className="input-field" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <Label>Descripción *</Label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Contá de qué trata el evento, artistas, duración, público al que va dirigido..." rows={5} className="input-field resize-none" />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y hora *</Label>
                  <input name="date" type="datetime-local" value={form.date} onChange={handleChange} className="input-field" />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <Label>Categoría</Label>
                  <select name="category" value={form.category} onChange={handleChange} className="input-field">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Lugar del evento *</Label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="Ej: Teatro Municipal, Bariloche" className="input-field" />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
            </div>
          </Card>

          {/* Imagen */}
          <Card title="Imagen del evento">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 mb-5 w-fit flex-wrap">
              {IMAGE_MODES.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => handleModeChange(key)}
                  className={`text-xs px-3 py-2 rounded-lg transition-all whitespace-nowrap ${imageMode === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {imageMode === 'emoji' && (
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(emoji => (
                  <button key={emoji} type="button" onClick={() => setForm(p => ({ ...p, image_emoji: emoji }))}
                    className={`w-11 h-11 text-2xl rounded-xl border-2 transition-all ${form.image_emoji === emoji ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-110' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {imageMode === 'file' && (
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {imagePreview ? (
                  <ImagePreview src={imagePreview} onClear={clearImage} clearLabel="Cambiar imagen" />
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand-300 transition-all text-gray-400">
                    <span className="text-3xl">📁</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Elegir imagen</span>
                    <span className="text-xs">JPG, PNG, WEBP — máx. 5MB</span>
                  </button>
                )}
                {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
              </div>
            )}

            {imageMode === 'camera' && (
              <div>
                {imagePreview ? (
                  <ImagePreview src={imagePreview} onClear={() => { clearImage(); setTimeout(startCamera, 100) }} clearLabel="Sacar otra foto" />
                ) : (
                  <div>
                    <div className="relative rounded-xl overflow-hidden bg-black h-52">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-white text-sm">Iniciando cámara...</div>}
                    </div>
                    {cameraActive && (
                      <button type="button" onClick={capturePhoto} className="mt-3 w-full btn-primary text-sm flex items-center justify-center gap-2">
                        <span>📸</span> Capturar foto
                      </button>
                    )}
                  </div>
                )}
                {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
              </div>
            )}

            {imageMode === 'url' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">Pegá la URL de una imagen de internet</p>
                <div className="flex gap-2 mb-3">
                  <input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlConfirm())}
                    placeholder="https://ejemplo.com/imagen.jpg" className="input-field flex-1 text-sm" />
                  <button type="button" onClick={handleUrlConfirm} className="btn-primary text-sm px-4 whitespace-nowrap">
                    Previsualizar
                  </button>
                </div>
                {imagePreview && (
                  <ImagePreview src={imagePreview} onClear={clearImage} clearLabel="Limpiar"
                    onError={() => setErrors(p => ({ ...p, image: 'No se pudo cargar la imagen. Verificá la URL.' }))} />
                )}
                {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
              </div>
            )}
          </Card>

          {/* Tipos de entrada */}
          <Card title="Tipos de entrada y precios">
            <div className="flex justify-end mb-4">
              <button type="button" onClick={addTicketType} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700">
                + Agregar tipo
              </button>
            </div>
            {errors.ticket_types && <p className="text-xs text-red-500 mb-3">{errors.ticket_types}</p>}
            <div className="space-y-3">
              {form.ticket_types.map((tt, index) => (
                <div key={tt.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label>Nombre *</Label>
                      <input value={tt.name} onChange={e => updateTicketType(index, 'name', e.target.value)} placeholder="Ej: General" className="input-field text-sm" />
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
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <Link to="/organizer/dashboard" className="btn-secondary flex-1 text-center text-sm">Cancelar</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
              {loading ? 'Enviando...' : isEditing ? 'Corregir y reenviar' : 'Enviar para revisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
