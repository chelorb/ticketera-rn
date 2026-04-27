// src/pages/admin/EventForm.jsx
// Formulario crear/editar eventos.
// NUEVO: carga de imagen por archivo, cámara o URL externa.

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getEvent, createEvent, updateEvent } from '../../api'

const CATEGORIES = ['Teatro', 'Música', 'Danza', 'Arte', 'Privado', 'Otro']
const EMOJIS = ['🎭', '🎵', '🎷', '💃', '🎊', '🖼️', '🎤', '🎬', '🏆', '🎪']
const EMPTY_FORM = {
  title: '', description: '', date: '', location: '',
  category: 'Teatro', image_emoji: '🎭', image_bg: '#E1F5EE',
  image_url: '',   // ← nueva: URL de la imagen real
  total_capacity: '', status: 'draft',
  ticket_types: [{ id: Date.now(), name: 'General', price: '', available: '' }]
}

// Modos de carga de imagen
const IMAGE_MODES = [
  { key: 'emoji',   label: '😀 Ícono' },
  { key: 'file',    label: '📁 Archivo' },
  { key: 'camera',  label: '📷 Cámara' },
  { key: 'url',     label: '🔗 URL' },
]

// ── Componente ImagePreview ───────────────────────────────────────────────────
// Muestra la imagen con un selector de ajuste (fit/fill/center) para que el
// admin elija cómo se recorta. Así siempre se ve bien sin importar las proporciones.
function ImagePreview({ src, onClear, clearLabel = 'Cambiar', onError }) {
  // fit     = la imagen completa, puede haber espacio en los costados (object-contain)
  // fill    = llena el espacio recortando los bordes (object-cover)
  // center  = muestra la imagen a tamaño real centrada
  const [fit, setFit] = useState('fill')

  const FIT_OPTIONS = [
    { key: 'fill',   label: 'Recortar' },
    { key: 'fit',    label: 'Completa' },
    { key: 'center', label: 'Original' },
  ]

  const objectClass = {
    fill:   'object-cover',
    fit:    'object-contain',
    center: 'object-none',
  }[fit]

  return (
    <div>
      {/* Selector de ajuste — pequeño, sobre la imagen */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Ajuste de imagen</span>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
          {FIT_OPTIONS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setFit(key)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all
                ${fit === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenedor de la imagen con altura fija */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
        <img
          src={src}
          alt="Preview"
          className={`w-full h-full transition-all duration-200 ${objectClass}`}
          onError={onError}
        />
        {/* Botón de acción flotante */}
        <button type="button" onClick={onClear}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white text-xs
                     px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors">
          {clearLabel}
        </button>
        {/* Indicador del modo activo */}
        <div className="absolute bottom-2 left-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
          { fit === 'fill' ? 'Recortando bordes' : fit === 'fit' ? 'Imagen completa' : 'Tamaño original' }
        </div>
      </div>
    </div>
  )
}

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(isEditing)

  // Modo de imagen seleccionado: 'emoji' | 'file' | 'camera' | 'url'
  const [imageMode, setImageMode] = useState('emoji')
  // Preview local de la imagen (base64 cuando se sube archivo/cámara)
  const [imagePreview, setImagePreview] = useState('')
  // Para la URL externa
  const [imageUrlInput, setImageUrlInput] = useState('')
  // Referencia al input file oculto
  const fileInputRef = useRef(null)
  // Referencia al video de la cámara
  const videoRef = useRef(null)
  // Stream activo de la cámara (para poder detenerlo)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    getEvent(id)
      .then(ev => {
        setForm({ ...ev, date: ev.date.slice(0, 16) })
        if (ev.image_url) {
          setImageMode('url')
          setImagePreview(ev.image_url)
          setImageUrlInput(ev.image_url)
        }
      })
      .catch(() => navigate('/admin'))
      .finally(() => setLoadingEvent(false))
  }, [id, isEditing])

  // Detener la cámara si el componente se desmonta o se cambia de modo
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // ── Manejo de imagen ──────────────────────────────────────────────────────

  // Convierte un File a base64 para preview y para guardar
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // Cuando el usuario elige un archivo desde disco
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Validamos que sea una imagen
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'El archivo debe ser una imagen (JPG, PNG, etc.)' }))
      return
    }
    // Validamos tamaño máximo: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'La imagen no puede superar 5MB' }))
      return
    }
    const base64 = await fileToBase64(file)
    setImagePreview(base64)
    setForm(prev => ({ ...prev, image_url: base64 }))
    setErrors(prev => ({ ...prev, image: '' }))
  }

  // Inicia el stream de la cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // cámara trasera en mobile
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch (err) {
      setErrors(prev => ({ ...prev, image: 'No se pudo acceder a la cámara. Verificá los permisos del navegador.' }))
    }
  }

  // Detiene el stream de la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  // Captura un frame del video como imagen
  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    // Creamos un canvas del mismo tamaño que el video
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.85) // calidad 85%
    setImagePreview(base64)
    setForm(prev => ({ ...prev, image_url: base64 }))
    stopCamera() // Detenemos la cámara después de capturar
  }

  // Cuando se confirma una URL externa
  const handleUrlConfirm = () => {
    if (!imageUrlInput.trim()) return
    setImagePreview(imageUrlInput.trim())
    setForm(prev => ({ ...prev, image_url: imageUrlInput.trim() }))
  }

  // Borra la imagen seleccionada y vuelve al estado inicial
  const clearImage = () => {
    setImagePreview('')
    setImageUrlInput('')
    setForm(prev => ({ ...prev, image_url: '' }))
    stopCamera()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Al cambiar de modo, limpiamos la imagen actual y detenemos la cámara
  const handleModeChange = (mode) => {
    clearImage()
    setImageMode(mode)
    if (mode === 'camera') {
      // Pequeño delay para que el DOM monte el elemento video primero
      setTimeout(() => startCamera(), 100)
    }
  }

  // ── Resto del formulario ─────────────────────────────────────────────────

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const addTicketType = () => setForm(prev => ({
    ...prev,
    ticket_types: [...prev.ticket_types, { id: Date.now(), name: '', price: '', available: '' }]
  }))
  const removeTicketType = i => setForm(prev => ({
    ...prev, ticket_types: prev.ticket_types.filter((_, idx) => idx !== i)
  }))
  const updateTicketType = (i, field, value) => setForm(prev => ({
    ...prev, ticket_types: prev.ticket_types.map((tt, idx) => idx === i ? { ...tt, [field]: value } : tt)
  }))

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
    const payload = {
      ...form,
      total_capacity: Number(form.total_capacity),
      available_tickets: Number(form.total_capacity),
      ticket_types: form.ticket_types.map(tt => ({
        ...tt, price: Number(tt.price), available: Number(tt.available)
      }))
    }
    setLoading(true)
    try {
      isEditing ? await updateEvent(id, payload) : await createEvent(payload)
      navigate('/admin')
    } catch { setErrors({ general: 'Error al guardar. Intentá de nuevo.' }) }
    finally { setLoading(false) }
  }

  if (loadingEvent) return <div className="min-h-screen dark:bg-gray-950 flex items-center justify-center text-gray-400">Cargando...</div>

  const Label = ({ children }) => <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{children}</label>
  const SectionCard = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar admin */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <Link to="/admin" className="font-semibold text-gray-900 dark:text-white">🎟️ TicketeraRN</Link>
        <span className="text-sm text-gray-500 dark:text-gray-400">{isEditing ? 'Editar evento' : 'Nuevo evento'}</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Volver</Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar evento' : 'Crear nuevo evento'}
          </h1>
        </div>

        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl p-4 mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Información básica ── */}
          <SectionCard title="Información básica">
            <div className="space-y-4">
              <div>
                <Label>Título del evento *</Label>
                <input name="title" value={form.title} onChange={handleChange}
                  placeholder="Ej: La Casa de Bernarda Alba" className="input-field" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <Label>Descripción</Label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describí el evento..." rows={4} className="input-field resize-none" />
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
                <Label>Lugar *</Label>
                <input name="location" value={form.location} onChange={handleChange}
                  placeholder="Ej: Teatro Municipal, Bariloche" className="input-field" />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Capacidad total *</Label>
                  <input name="total_capacity" type="number" min="1" value={form.total_capacity}
                    onChange={handleChange} placeholder="200" className="input-field" />
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

          {/* ── Imagen del evento ── */}
          <SectionCard title="Imagen del evento">

            {/* Selector de modo */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 mb-5 w-fit flex-wrap">
              {IMAGE_MODES.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => handleModeChange(key)}
                  className={`text-xs px-3 py-2 rounded-lg transition-all whitespace-nowrap
                    ${imageMode === key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Modo: Ícono emoji ── */}
            {imageMode === 'emoji' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">Elegí un ícono representativo del evento</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(emoji => (
                    <button key={emoji} type="button"
                      onClick={() => setForm(prev => ({ ...prev, image_emoji: emoji }))}
                      className={`w-11 h-11 text-2xl rounded-xl border-2 transition-all
                        ${form.image_emoji === emoji
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-110'
                          : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
                        }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Modo: Archivo desde disco ── */}
            {imageMode === 'file' && (
              <div>
                {/* Input file oculto — lo activamos con el botón de abajo */}
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={handleFileChange} className="hidden" />

                {imagePreview ? (
                  <ImagePreview src={imagePreview} onClear={clearImage} clearLabel="Cambiar imagen" />
                ) : (
                  /* Zona de drop / botón para elegir archivo */
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-700
                               rounded-xl flex flex-col items-center justify-center gap-2
                               hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/30
                               dark:hover:bg-brand-900/10 transition-all text-gray-400">
                    <span className="text-3xl">📁</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Elegir imagen</span>
                    <span className="text-xs">JPG, PNG, WEBP — máx. 5MB</span>
                  </button>
                )}
                {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
              </div>
            )}

            {/* ── Modo: Cámara ── */}
            {imageMode === 'camera' && (
              <div>
                {imagePreview ? (
                  <ImagePreview src={imagePreview} onClear={() => { clearImage(); setTimeout(startCamera, 100) }} clearLabel="Sacar otra foto" />
                ) : (
                  <div>
                    {/* Video stream de la cámara */}
                    <div className="relative rounded-xl overflow-hidden bg-black h-52">
                      <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover" />
                      {!cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                          Iniciando cámara...
                        </div>
                      )}
                    </div>
                    {cameraActive && (
                      <button type="button" onClick={capturePhoto}
                        className="mt-3 w-full btn-primary text-sm flex items-center justify-center gap-2">
                        <span>📸</span> Capturar foto
                      </button>
                    )}
                  </div>
                )}
                {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
              </div>
            )}

            {/* ── Modo: URL externa ── */}
            {imageMode === 'url' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">
                  Pegá la dirección web de una imagen (ej: de Google Drive, Imgur, tu sitio, etc.)
                </p>
                <div className="flex gap-2 mb-3">
                  <input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlConfirm())}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="input-field flex-1 text-sm" />
                  <button type="button" onClick={handleUrlConfirm}
                    className="btn-primary text-sm px-4 whitespace-nowrap">
                    Previsualizar
                  </button>
                </div>
                {imagePreview && (
                  <ImagePreview src={imagePreview} onClear={clearImage} clearLabel="Limpiar"
                    onError={() => setErrors(prev => ({ ...prev, image: 'No se pudo cargar la imagen. Verificá la URL.' }))} />
                )}
                {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
              </div>
            )}
          </SectionCard>

          {/* ── Tipos de entrada ── */}
          <SectionCard title="Tipos de entrada">
            <div className="flex justify-end mb-4">
              <button type="button" onClick={addTicketType}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
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
                      <input value={tt.name} onChange={e => updateTicketType(index, 'name', e.target.value)}
                        placeholder="Ej: Platea" className="input-field text-sm" />
                      {errors[`tt_name_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`tt_name_${index}`]}</p>}
                    </div>
                    <div>
                      <Label>Precio (ARS) *</Label>
                      <input type="number" min="0" value={tt.price}
                        onChange={e => updateTicketType(index, 'price', e.target.value)}
                        placeholder="0 = gratis" className="input-field text-sm" />
                      {errors[`tt_price_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`tt_price_${index}`]}</p>}
                    </div>
                    <div>
                      <Label>Cantidad *</Label>
                      <input type="number" min="1" value={tt.available}
                        onChange={e => updateTicketType(index, 'available', e.target.value)}
                        placeholder="100" className="input-field text-sm" />
                      {errors[`tt_avail_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`tt_avail_${index}`]}</p>}
                    </div>
                  </div>
                  {form.ticket_types.length > 1 && (
                    <button type="button" onClick={() => removeTicketType(index)}
                      className="text-xs text-red-400 hover:text-red-600 mt-2">
                      Eliminar este tipo
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Botones */}
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
