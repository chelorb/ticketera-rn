// src/pages/admin/Dashboard.jsx
// Panel principal del administrador.
// Muestra estadísticas generales y listado de eventos con acciones.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getAllEvents, deleteEvent } from '../../api'
import { useAuth } from '../../context/AuthContext'

function formatPrice(n) {
  return '$' + n.toLocaleString('es-AR')
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// Tarjeta de estadística reutilizable
function StatCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span className={`text-2xl p-2 rounded-xl ${color}`}>{icon}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getAllEvents()])
      .then(([statsData, eventsData]) => {
        setStats(statsData)
        setEvents(eventsData)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`¿Eliminár el evento "${title}"? Esta acción no se puede deshacer.`)) return
    await deleteEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const STATUS_LABELS = {
    published: { label: 'Publicado', cls: 'bg-brand-50 text-brand-700' },
    draft:     { label: 'Borrador',  cls: 'bg-gray-100 text-gray-500' },
    cancelled: { label: 'Cancelado', cls: 'bg-red-50 text-red-600' },
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar del admin */}
      <div className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-900">🎟️ TicketeraRN</span>
          <span className="text-gray-200">|</span>
          <span className="text-sm text-gray-500">Panel Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">Ver sitio →</Link>
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500">Salir</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <Link to="/admin/eventos/nuevo" className="btn-primary text-sm">
            + Nuevo evento
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <>
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Eventos activos"    value={stats?.active_events}  icon="🎭" color="bg-brand-50" />
              <StatCard label="Entradas vendidas"  value={stats?.tickets_sold?.toLocaleString()} icon="🎫" color="bg-blue-50" />
              <StatCard label="Ingresos del mes"   value={formatPrice(stats?.monthly_revenue)} icon="💰" color="bg-amber-50" />
              <StatCard label="Por validar hoy"    value={stats?.pending_validation} icon="✅" color="bg-purple-50" />
            </div>

            {/* Tabla de eventos */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 text-sm">Todos los eventos</h2>
                <span className="text-xs text-gray-400">{events.length} eventos</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Evento</th>
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Fecha</th>
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Entradas</th>
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Estado</th>
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => {
                      const sold = event.total_capacity - event.available_tickets
                      const status = STATUS_LABELS[event.status] || STATUS_LABELS.draft
                      return (
                        <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{event.image_emoji}</span>
                              <div>
                                <p className="font-medium text-gray-900">{event.title}</p>
                                <p className="text-xs text-gray-400">{event.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                            {formatDate(event.date)}
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-gray-900">{sold} / {event.total_capacity}</p>
                            {/* Barra de progreso mini */}
                            <div className="h-1 bg-gray-100 rounded-full mt-1 w-24">
                              <div
                                className="h-full bg-brand-500 rounded-full"
                                style={{ width: `${(sold / event.total_capacity) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/admin/eventos/${event.id}/editar`}
                                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                              >
                                Editar
                              </Link>
                              <span className="text-gray-200">|</span>
                              <button
                                onClick={() => handleDelete(event.id, event.title)}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Links rápidos */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Link to="/admin/entradas" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 transition-colors">
                <p className="font-medium text-gray-900 text-sm">🎫 Entradas vendidas</p>
                <p className="text-xs text-gray-400 mt-1">Ver historial completo de ventas</p>
              </Link>
              <Link to="/admin/validador" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 transition-colors">
                <p className="font-medium text-gray-900 text-sm">📷 Validador QR</p>
                <p className="text-xs text-gray-400 mt-1">Escanear entradas en la puerta</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
