// src/pages/Success.jsx
// Pantalla de confirmación de compra. Muestra el QR de la entrada.
// El QR se genera en el cliente con la librería qrcode.react.
// En producción, el backend también genera el QR y lo envía por email.

import { useLocation, Link, Navigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Navbar from '../components/Navbar'

function formatPrice(n) {
  return '$' + n.toLocaleString('es-AR')
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function Success() {
  // useLocation() lee el estado que pasamos desde Checkout con navigate()
  const { state } = useLocation()

  // Si alguien entra directamente a esta URL sin haber comprado, redirigir
  if (!state?.ticket) {
    return <Navigate to="/" replace />
  }

  const { ticket } = state

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-12 text-center">

        {/* Ícono de éxito */}
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✅</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Compra confirmada!</h1>
        <p className="text-gray-500 text-sm mb-2">
          Hola, <strong>{ticket.buyer_name}</strong>.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Tu entrada fue enviada a <strong>{ticket.buyer_email}</strong>.
          Presentá este QR a la entrada del evento.
        </p>

        {/* Tarjeta de entrada con QR */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 shadow-sm">

          {/* Cabecera de la entrada */}
          <div className="bg-brand-700 px-6 py-5 text-white">
            <p className="text-xs text-brand-200 uppercase tracking-wider mb-1">Entrada</p>
            <h2 className="font-bold text-lg leading-tight">{ticket.event_title}</h2>
            <p className="text-brand-200 text-sm mt-1">{formatDate(ticket.event_date)}</p>
          </div>

          {/* Separador dentado (efecto ticket físico) */}
          <div className="flex items-center px-6 py-0">
            <div className="w-4 h-4 rounded-full bg-gray-50 -ml-10 border-r border-gray-100" />
            <div className="flex-1 border-t border-dashed border-gray-200 mx-2" />
            <div className="w-4 h-4 rounded-full bg-gray-50 -mr-10 border-l border-gray-100" />
          </div>

          {/* QR Code */}
          <div className="px-6 py-6">
            <div className="bg-white p-3 rounded-xl inline-block border border-gray-100 mb-4">
              {/*
                QRCodeSVG genera un código QR como SVG.
                El valor es el qr_code único del ticket.
                El backend escanea este valor para validar la entrada.
              */}
              <QRCodeSVG
                value={ticket.qr_code}
                size={160}
                level="H"           // Nivel H = alta corrección de errores (más robusto)
                includeMargin={false}
              />
            </div>
            <p className="text-xs font-mono text-gray-400 tracking-wider">{ticket.qr_code}</p>
          </div>

          {/* Detalles de la entrada */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-y-3 text-left">
            <div>
              <p className="text-xs text-gray-400">Tipo</p>
              <p className="text-sm font-medium text-gray-900">{ticket.ticket_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Cantidad</p>
              <p className="text-sm font-medium text-gray-900">{ticket.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Titular</p>
              <p className="text-sm font-medium text-gray-900">{ticket.buyer_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total pagado</p>
              <p className="text-sm font-medium text-gray-900">{formatPrice(ticket.total_paid)}</p>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-6">
          <p className="text-xs text-amber-700 font-medium mb-1">⚠️ Importante</p>
          <ul className="text-xs text-amber-600 space-y-1">
            <li>• Guardá esta pantalla o el email con tu QR</li>
            <li>• El QR es personal e intransferible</li>
            <li>• Presentalo en pantalla o impreso en la entrada</li>
          </ul>
        </div>

        <Link to="/" className="btn-secondary text-sm">
          Volver a eventos
        </Link>
      </div>
    </div>
  )
}
