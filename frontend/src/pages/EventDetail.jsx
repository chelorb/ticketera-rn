// src/pages/EventDetail.jsx
// Página de detalle de un evento. Muestra toda la info y permite
// seleccionar tipo de entrada y cantidad para comprar.

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getEvent } from '../api'
import { useCart } from '../context/CartContext'
import Navbar from '../components/Navbar'

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) + ' · ' + date.toTimeString().slice(0, 5) + ' hs'
}

function formatPrice(price) {
  if (price === 0) return 'Gratis'
  return '$' + price.toLocaleString('es-AR')
}

export default function EventDetail() {
  // useParams() lee el :id de la URL (ej: /eventos/3 → id = "3")
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedType, setSelectedType] = useState(null) // tipo de entrada elegido
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    getEvent(id)
      .then(data => {
        setEvent(data)
        setSelectedType(data.ticket_types[0]) // selecciona el primero por defecto
      })
      .catch(() => setError('No pudimos cargar el evento'))
      .finally(() => setLoading(false))
  }, [id])

  const handleBuy = () => {
    addToCart(event, selectedType, quantity)
    navigate('/checkout')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>
    </div>
  )

  if (error || !event) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="text-center py-20">
        <p className="text-gray-500">{error || 'Evento no encontrado'}</p>
        <Link to="/" className="text-brand-500 text-sm mt-2 inline-block">← Volver al inicio</Link>
      </div>
    </div>
  )

  const total = selectedType ? selectedType.price * quantity : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header del evento */}
      <div className="bg-brand-700 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="text-brand-200 text-sm hover:text-white mb-4 inline-block">
            ← Volver a eventos
          </Link>

          <div className="flex items-start gap-5">
            {/* Emoji / imagen */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ backgroundColor: event.image_bg }}
            >
              {event.image_emoji}
            </div>

            <div>
              <span className="text-brand-200 text-xs font-medium uppercase tracking-wider">
                {event.category}
              </span>
              <h1 className="text-2xl font-bold text-white mt-1 mb-3">{event.title}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span className="text-brand-100 text-sm">📅 {formatDate(event.date)}</span>
                <span className="text-brand-100 text-sm">📍 {event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo: descripción + selector de entradas */}
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Descripción (ocupa 2/3 del ancho en desktop) */}
        <div className="md:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-3">Sobre el evento</h2>
          {event.description.split('\n\n').map((para, i) => (
            <p key={i} className="text-gray-500 text-sm leading-relaxed mb-3">{para}</p>
          ))}

          {/* Disponibilidad general */}
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Entradas disponibles: </span>
              {event.available_tickets} de {event.total_capacity}
            </p>
            {/* Barra de progreso */}
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${(event.available_tickets / event.total_capacity) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Selector de entradas (ocupa 1/3) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Elegí tu entrada</h3>

          {/* Tipos de entrada */}
          <div className="space-y-2 mb-5">
            {event.ticket_types.map(type => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type); setQuantity(1) }}
                disabled={type.available === 0}
                className={`w-full text-left p-3 rounded-xl border transition-all
                  ${selectedType?.id === type.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-100 hover:border-brand-200'
                  }
                  ${type.available === 0 ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{type.name}</p>
                    <p className="text-xs text-gray-400">
                      {type.available === 0 ? 'Agotado' : `${type.available} disponibles`}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {formatPrice(type.price)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Selector de cantidad */}
          {selectedType && selectedType.available > 0 && (
            <>
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-gray-600">Cantidad</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="font-semibold w-4 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(selectedType.available, q + 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total */}
              {total > 0 && (
                <div className="flex justify-between text-sm mb-4 py-3 border-t border-gray-50">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
                </div>
              )}

              {/* Botón de compra */}
              <button onClick={handleBuy} className="btn-primary w-full text-sm">
                {total === 0 ? 'Reservar entrada gratis' : `Comprar · ${formatPrice(total)}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
