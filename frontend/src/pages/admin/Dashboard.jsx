// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getAllEvents, deleteEvent } from '../../api'
import { useAuth } from '../../context/AuthContext'

function formatPrice(n) { return '$' + n.toLocaleString('es-AR') }
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({ label, value, icon, bg }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <span className={`text-2xl p-2 rounded-xl ${bg}`}>{icon}</span>
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
      .then(([s, e]) => { setStats(s); setEvents(e) })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return
    await deleteEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const STATUS = {
    published: { label: 'Publicado', cls: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' },
    draft:     { label: 'Borrador',  cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
    cancelled: { label: 'Cancelado', cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar admin */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-900 dark:text-white">🎟️ TicketeraRN</span>
          <span className="text-gray-200 dark:text-gray-700">|</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Panel Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Ver sitio →</Link>
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500">Salir</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <Link to="/admin/eventos/nuevo" className="btn-primary text-sm">+ Nuevo evento</Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Eventos activos"   value={stats?.active_events} icon="🎭" bg="bg-brand-50 dark:bg-brand-900/20" />
              <StatCard label="Entradas vendidas" value={stats?.tickets_sold?.toLocaleString()} icon="🎫" bg="bg-blue-50 dark:bg-blue-900/20" />
              <StatCard label="Ingresos del mes"  value={formatPrice(stats?.monthly_revenue)} icon="💰" bg="bg-amber-50 dark:bg-amber-900/20" />
              <StatCard label="Por validar hoy"   value={stats?.pending_validation} icon="✅" bg="bg-purple-50 dark:bg-purple-900/20" />
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Todos los eventos</h2>
                <span className="text-xs text-gray-400">{events.length} eventos</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-gray-700">
                      {['Evento', 'Fecha', 'Entradas', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => {
                      const sold = event.total_capacity - event.available_tickets
                      const st = STATUS[event.status] || STATUS.draft
                      return (
                        <tr key={event.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{event.image_emoji}</span>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                                <p className="text-xs text-gray-400 hidden sm:block">{event.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(event.date)}</td>
                          <td className="px-5 py-3">
                            <p className="text-gray-900 dark:text-white">{sold} / {event.total_capacity}</p>
                            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 w-24">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(sold / event.total_capacity) * 100}%` }} />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Link to={`/admin/eventos/${event.id}/editar`} className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">Editar</Link>
                              <span className="text-gray-200 dark:text-gray-700">|</span>
                              <button onClick={() => handleDelete(event.id, event.title)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Link to="/admin/entradas" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white text-sm">🎫 Entradas vendidas</p>
                <p className="text-xs text-gray-400 mt-1">Ver historial completo de ventas</p>
              </Link>
              <Link to="/admin/validador" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white text-sm">📷 Validador QR</p>
                <p className="text-xs text-gray-400 mt-1">Escanear entradas en la puerta</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
