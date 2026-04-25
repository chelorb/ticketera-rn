// src/components/EventCard.jsx
// Tarjeta de evento que se muestra en el listado del Home.
// Recibe un evento como prop y muestra su info resumida.

import { Link } from 'react-router-dom'

// Formatea una fecha ISO a texto legible en español
// Ejemplo: "2025-06-14T21:00:00" → "Sáb 14 Jun · 21:00"
function formatDate(isoString) {
  const date = new Date(isoString)
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const hora = date.toTimeString().slice(0, 5)
  return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]} · ${hora}`
}

// Formatea precio: 4500 → "$4.500"
function formatPrice(price) {
  if (price === 0) return 'Gratis'
  return '$' + price.toLocaleString('es-AR')
}

// Colores por categoría (badge de categoría)
const CATEGORY_STYLES = {
  Teatro:  'bg-brand-50 text-brand-700',
  Música:  'bg-blue-50 text-blue-700',
  Danza:   'bg-pink-50 text-pink-700',
  Arte:    'bg-orange-50 text-orange-700',
  Privado: 'bg-amber-50 text-amber-700',
}

export default function EventCard({ event }) {
  const minPrice = Math.min(...event.ticket_types.map(t => t.price))
  const isSoldOut = event.available_tickets === 0
  const isAlmostGone = event.available_tickets > 0 && event.available_tickets <= 20
  const categoryStyle = CATEGORY_STYLES[event.category] || 'bg-gray-100 text-gray-600'

  return (
    <Link
      to={`/eventos/${event.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-brand-200 hover:shadow-md transition-all block"
    >
      {/* Imagen / Emoji del evento */}
      <div
        className="h-32 flex items-center justify-center text-5xl"
        style={{ backgroundColor: event.image_bg || '#f3f4f6' }}
      >
        {event.image_emoji || '🎫'}
      </div>

      <div className="p-4">
        {/* Badge de categoría */}
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryStyle}`}>
          {event.category}
        </span>

        {/* Título */}
        <h3 className="font-semibold text-gray-900 mt-2 mb-1 leading-snug group-hover:text-brand-700 transition-colors">
          {event.title}
        </h3>

        {/* Fecha y lugar */}
        <p className="text-xs text-gray-400 mb-1">{formatDate(event.date)}</p>
        <p className="text-xs text-gray-400 mb-3 truncate">📍 {event.location}</p>

        {/* Footer: precio + disponibilidad */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            {minPrice === 0 ? 'Gratis' : `Desde ${formatPrice(minPrice)}`}
          </span>

          {isSoldOut ? (
            <span className="text-xs text-red-500 font-medium">Agotado</span>
          ) : isAlmostGone ? (
            <span className="text-xs text-amber-600 font-medium">¡Últimos!</span>
          ) : (
            <span className="text-xs text-brand-600 font-medium">Ver →</span>
          )}
        </div>
      </div>
    </Link>
  )
}
