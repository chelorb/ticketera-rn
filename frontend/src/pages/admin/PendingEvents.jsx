// src/pages/admin/PendingEvents.jsx
// Vista del admin para revisar eventos enviados por organizadores.
// Puede aprobarlos (se publican) o rechazarlos con un motivo escrito.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPendingEvents, approveEvent, rejectEvent } from '../../api'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) + ' · ' + new Date(isoString).toTimeString().slice(0, 5) + ' hs'
}
function formatPrice(p) { return p === 0 ? 'Gratis' : '$' + p.toLocaleString('es-AR') }

export default function PendingEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  // ID del evento con el panel de rechazo abierto
  const [rejectingId, setRejectingId] = useState(null)
  // Motivo de rechazo en el textarea
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    getPendingEvents().then(setEvents).finally(() => setLoading(false))
  }, [])

  // Aprueba el evento: cambia estado a published y lo saca de la lista
  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await approveEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } finally { setActionLoading(false) }
  }

  // Abre el panel de rechazo para ese evento
  const openReject = (id) => {
    setRejectingId(id)
    setRejectReason('')
  }

  // Confirma el rechazo con el motivo escrito
  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    try {
      await rejectEvent(rejectingId, rejectReason)
      setEvents(prev => prev.filter(e => e.id !== rejectingId))
      setRejectingId(null)
      setRejectReason('')
    } finally { setActionLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar admin */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <span className="font-semibold text-gray-900 dark:text-white">🎟️ TicketeraRN</span>
        <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">← Dashboard</Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Eventos pendientes de revisión</h1>
          {events.length > 0 && (
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full">
              {events.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-medium text-gray-600 dark:text-gray-400">No hay eventos pendientes</p>
            <p className="text-sm text-gray-400 mt-1">Todos los eventos fueron revisados</p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map(event => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">

                {/* Cabecera del evento */}
                <div className="p-5 border-b border-gray-50 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    {event.image_url ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ backgroundColor: event.image_bg }}>
                        {event.image_emoji}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{event.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{event.category}</p>
                        </div>
                        <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900 text-xs font-medium px-3 py-1 rounded-full">
                          ⏳ Pendiente de revisión
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalle del evento */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Fecha y hora</p>
                      <p className="text-gray-900 dark:text-white font-medium">{formatDate(event.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Lugar</p>
                      <p className="text-gray-900 dark:text-white font-medium">{event.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Capacidad total</p>
                      <p className="text-gray-900 dark:text-white font-medium">{event.total_capacity} personas</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Tipos de entrada</p>
                      <div className="flex flex-wrap gap-1">
                        {event.ticket_types.map(tt => (
                          <span key={tt.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                            {tt.name} — {formatPrice(tt.price)} ({tt.available} disp.)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Descripción completa */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Descripción</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Panel de rechazo (se muestra solo cuando se hace click en Rechazar) */}
                {rejectingId === event.id && (
                  <div className="px-5 pb-5">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-xl p-4">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                        Escribí el motivo del rechazo — el organizador lo recibirá por email
                      </p>
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Ej: La descripción es muy corta. Por favor agregá más detalle sobre el evento y confirmá el lugar exacto."
                        rows={3}
                        className="input-field text-sm resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
                          {actionLoading ? 'Enviando...' : 'Confirmar rechazo'}
                        </button>
                        <button onClick={() => setRejectingId(null)}
                          className="btn-secondary text-sm px-4 py-2">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleApprove(event.id)}
                    disabled={actionLoading || rejectingId === event.id}
                    className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                  >
                    ✅ Aprobar y publicar
                  </button>
                  <button
                    onClick={() => rejectingId === event.id ? setRejectingId(null) : openReject(event.id)}
                    disabled={actionLoading}
                    className="flex-1 text-sm font-medium py-2.5 px-4 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    ❌ {rejectingId === event.id ? 'Cancelar rechazo' : 'Rechazar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
