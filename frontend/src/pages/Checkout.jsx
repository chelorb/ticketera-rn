// src/pages/Checkout.jsx
// Formulario de compra. El usuario completa sus datos y confirma.
// Por ahora el pago está simulado. Cuando el backend esté listo,
// aquí se integra Mercado Pago.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { purchaseTicket } from '../api'
import Navbar from '../components/Navbar'

function formatPrice(n) {
  return '$' + n.toLocaleString('es-AR')
}

export default function Checkout() {
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()

  // Estado del formulario
  const [form, setForm] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_email_confirm: '',
    buyer_dni: '',
    buyer_phone: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Si no hay nada en el carrito, redirigir al inicio
  if (!cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No tenés ninguna entrada seleccionada.</p>
          <Link to="/" className="btn-primary text-sm">Ver eventos</Link>
        </div>
      </div>
    )
  }

  // Actualiza el campo del formulario
  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    // Borra el error del campo al empezar a escribir
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  // Validaciones básicas del formulario
  const validate = () => {
    const newErrors = {}
    if (!form.buyer_name.trim()) newErrors.buyer_name = 'Ingresá tu nombre completo'
    if (!form.buyer_email.trim()) newErrors.buyer_email = 'Ingresá tu email'
    else if (!/\S+@\S+\.\S+/.test(form.buyer_email)) newErrors.buyer_email = 'Email inválido'
    if (form.buyer_email !== form.buyer_email_confirm) newErrors.buyer_email_confirm = 'Los emails no coinciden'
    if (!form.buyer_dni.trim()) newErrors.buyer_dni = 'Ingresá tu DNI'
    return newErrors
  }

  // Envío del formulario
  const handleSubmit = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const result = await purchaseTicket({
        ...form,
        event_id: cart.event.id,
        event_title: cart.event.title,
        event_date: cart.event.date,
        ticket_type_id: cart.ticketType.id,
        ticket_type_name: cart.ticketType.name,
        quantity: cart.quantity,
        total: cart.subtotal + cart.serviceFee,
      })

      clearCart() // Vaciamos el carrito
      // Navegamos a la pantalla de éxito, pasando el ticket como estado de ruta
      navigate('/confirmacion', { state: { ticket: result.ticket } })
    } catch (err) {
      setErrors({ general: 'Hubo un error al procesar la compra. Intentá de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={`/eventos/${cart.event.id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
          ← Volver al evento
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mb-6">Completá tu compra</h1>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Resumen del pedido</h2>
          <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: cart.event.image_bg }}
            >
              {cart.event.image_emoji}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{cart.event.title}</p>
              <p className="text-xs text-gray-400">{cart.ticketType.name} × {cart.quantity}</p>
            </div>
            <span className="font-semibold text-gray-900">{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="pt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Cargo por servicio (5%)</span><span>{formatPrice(cart.serviceFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-50 mt-2">
              <span>Total a pagar</span>
              <span>{formatPrice(cart.subtotal + cart.serviceFee)}</span>
            </div>
          </div>
        </div>

        {/* Formulario de datos del comprador */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tus datos</h2>
          <div className="space-y-4">

            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre completo *</label>
              <input
                name="buyer_name"
                value={form.buyer_name}
                onChange={handleChange}
                placeholder="Juan Pérez"
                className="input-field"
              />
              {errors.buyer_name && <p className="text-xs text-red-500 mt-1">{errors.buyer_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input
                  name="buyer_email"
                  type="email"
                  value={form.buyer_email}
                  onChange={handleChange}
                  placeholder="juan@email.com"
                  className="input-field"
                />
                {errors.buyer_email && <p className="text-xs text-red-500 mt-1">{errors.buyer_email}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Confirmar email *</label>
                <input
                  name="buyer_email_confirm"
                  type="email"
                  value={form.buyer_email_confirm}
                  onChange={handleChange}
                  placeholder="juan@email.com"
                  className="input-field"
                />
                {errors.buyer_email_confirm && <p className="text-xs text-red-500 mt-1">{errors.buyer_email_confirm}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">DNI *</label>
                <input
                  name="buyer_dni"
                  value={form.buyer_dni}
                  onChange={handleChange}
                  placeholder="12.345.678"
                  className="input-field"
                />
                {errors.buyer_dni && <p className="text-xs text-red-500 mt-1">{errors.buyer_dni}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                <input
                  name="buyer_phone"
                  value={form.buyer_phone}
                  onChange={handleChange}
                  placeholder="+54 9 11 ..."
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de pago simulado */}
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 text-sm text-brand-700">
          🔧 <strong>Modo desarrollo:</strong> el pago está simulado. En producción se integrará Mercado Pago.
        </div>

        {errors.general && (
          <p className="text-sm text-red-500 mb-4 text-center">{errors.general}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full text-base"
        >
          {loading ? 'Procesando...' : `Confirmar y pagar ${formatPrice(cart.subtotal + cart.serviceFee)}`}
        </button>
      </div>
    </div>
  )
}
