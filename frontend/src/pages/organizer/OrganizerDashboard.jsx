// src/pages/organizer/OrganizerDashboard.jsx
// Panel principal del organizador.
// Ve sus eventos con el estado de cada uno: pendiente, aprobado o rechazado.
// Si un evento fue rechazado, puede editarlo y reenviarlo.

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOrganizerEvents } from '../../api'
import { useAuth } from '../../context/AuthContext'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

// Badge de estado con color y texto según el estado del evento
function StatusBadge({ status }) {
  const STYLES = {
    pending:   { label: '⏳ Pendiente de revisión', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900' },
    published: { label: '✅ Aprobado y publicado',  cls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900' },
    rejected:  { label: '❌ Rechazado',              cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900' },
    draft:     { label: '📝 Borrador',               cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600' },
  }
  const { label, cls } = STYLES[status] || STYLES.draft
  return <span className={`text-xs font-medium px-3 py-1 rounded-full ${cls}`}>{label}</span>
}

export default function OrganizerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrganizerEvents(user.id)
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [user.id])

  const handleLogout = () => { logout(); navigate('/organizer/login') }

  // Contadores rápidos para el resumen
  const counts = {
    total:     events.length,
    pending:   events.filter(e => e.status === 'pending').length,
    published: events.filter(e => e.status === 'published').length,
    rejected:  events.filter(e => e.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Navbar del organizador */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🎟️</span>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">TicketeraRN</span>
            <span className="text-gray-300 dark:text-gray-700 mx-2">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{user?.name}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          Salir
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mis eventos</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.organization}</p>
          </div>
          <Link to="/organizer/eventos/nuevo" className="btn-primary text-sm text-center">
            + Cargar nuevo evento
          </Link>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: counts.total, color: 'text-gray-900 dark:text-white' },
            { label: 'Pendientes', value: counts.pending, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Publicados', value: counts.published, color: 'text-brand-600 dark:text-brand-400' },
            { label: 'Rechazados', value: counts.rejected, color: 'text-red-500 dark:text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Lista de eventos */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando tus eventos...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎭</p>
            <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Todavía no cargaste ningún evento</p>
            <p className="text-sm text-gray-400 mb-6">Creá tu primer evento para que sea revisado y publicado</p>
            <Link to="/organizer/eventos/nuevo" className="btn-primary text-sm">Cargar mi primer evento</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                  {/* Ícono / imagen */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: event.image_bg }}>
                    {event.image_emoji}
                  </div>

                  {/* Info del evento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="text-xs text-gray-400 mb-1">📅 {formatDate(event.date)} · 📍 {event.location}</p>
                    <p className="text-xs text-gray-400">
                      {event.ticket_types.map(tt => `${tt.name} $${tt.price.toLocaleString('es-AR')}`).join(' · ')}
                    </p>

                    {/* Motivo de rechazo — solo si fue rechazado */}
                    {event.status === 'rejected' && event.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-xl">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                          Motivo del rechazo:
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">{event.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones según el estado */}
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex gap-3">
                  {event.status === 'rejected' && (
                    // Si fue rechazado: puede editar y reenviar
                    <Link to={`/organizer/eventos/${event.id}/editar`}
                      className="btn-primary text-xs px-4 py-2">
                      Corregir y reenviar
                    </Link>
                  )}
                  {event.status === 'pending' && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      ⏳ En revisión — te notificaremos cuando sea aprobado
                    </span>
                  )}
                  {event.status === 'published' && (
                    <Link to={`/eventos/${event.id}`} target="_blank"
                      className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
                      Ver en el sitio →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info de contacto */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400">
            ¿Tenés dudas sobre tu evento? Contactá al administrador en{' '}
            <a href="mailto:admin@ticketera.com" className="text-brand-500 hover:underline">
              admin@ticketera.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
