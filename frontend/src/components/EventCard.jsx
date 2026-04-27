// src/components/EventCard.jsx
// Vista pública: muestra "Disponible" o "Agotado", sin revelar la cantidad exacta.

import { Link } from 'react-router-dom'

function formatDate(isoString) {
  const date = new Date(isoString)
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]} · ${date.toTimeString().slice(0, 5)}`
}

function formatPrice(price) {
  return price === 0 ? 'Gratis' : '$' + price.toLocaleString('es-AR')
}

const CATEGORY_STYLES = {
  Teatro:  'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  Música:  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Danza:   'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Arte:    'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Privado: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

export default function EventCard({ event }) {
  const minPrice = Math.min(...event.ticket_types.map(t => t.price))
  const isSoldOut = event.available_tickets === 0
  // "Últimos" = menos del 10% disponible, pero el cliente NO ve la cantidad
  const isAlmostGone = !isSoldOut && (event.available_tickets / event.total_capacity) < 0.10
  const categoryStyle = CATEGORY_STYLES[event.category] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  return (
    <Link to={`/eventos/${event.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700
                 overflow-hidden hover:border-brand-200 dark:hover:border-brand-700
                 hover:shadow-md transition-all block">

      {/* Imagen del evento: si hay image_url la usamos, si no el emoji */}
      {event.image_url ? (
        <div className="h-36 overflow-hidden">
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-36 flex items-center justify-center text-5xl"
          style={{ backgroundColor: event.image_bg || '#f3f4f6' }}>
          {event.image_emoji || '🎫'}
        </div>
      )}

      <div className="p-4">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryStyle}`}>
          {event.category}
        </span>
        <h3 className="font-semibold text-gray-900 dark:text-white mt-2 mb-1 leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
          {event.title}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{formatDate(event.date)}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 truncate">📍 {event.location}</p>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white">
            {minPrice === 0 ? 'Gratis' : `Desde ${formatPrice(minPrice)}`}
          </span>

          {/* El cliente solo ve si hay o no hay entradas, sin números */}
          {isSoldOut ? (
            <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-medium px-2 py-0.5 rounded-full">
              Agotado
            </span>
          ) : isAlmostGone ? (
            <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 rounded-full">
              ¡Últimas entradas!
            </span>
          ) : (
            <span className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium px-2 py-0.5 rounded-full">
              Disponible
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
