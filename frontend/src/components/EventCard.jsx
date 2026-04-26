// src/components/EventCard.jsx
// Tarjeta de evento con soporte para dark mode.

import { Link } from 'react-router-dom'

function formatDate(isoString) {
  const date = new Date(isoString)
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const hora = date.toTimeString().slice(0, 5)
  return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]} · ${hora}`
}

function formatPrice(price) {
  if (price === 0) return 'Gratis'
  return '$' + price.toLocaleString('es-AR')
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
  const isAlmostGone = event.available_tickets > 0 && event.available_tickets <= 20
  const categoryStyle = CATEGORY_STYLES[event.category] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  return (
    <Link
      to={`/eventos/${event.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700
                 overflow-hidden hover:border-brand-200 dark:hover:border-brand-700
                 hover:shadow-md dark:hover:shadow-gray-900 transition-all block"
    >
      <div className="h-32 flex items-center justify-center text-5xl" style={{ backgroundColor: event.image_bg || '#f3f4f6' }}>
        {event.image_emoji || '🎫'}
      </div>
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
          {isSoldOut ? (
            <span className="text-xs text-red-500 font-medium">Agotado</span>
          ) : isAlmostGone ? (
            <span className="text-xs text-amber-600 font-medium">¡Últimos!</span>
          ) : (
            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Ver →</span>
          )}
        </div>
      </div>
    </Link>
  )
}
