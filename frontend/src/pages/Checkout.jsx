// src/pages/Checkout.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { purchaseTicket } from '../api'
import Navbar from '../components/Navbar'

function formatPrice(n) { return '$' + n.toLocaleString('es-AR') }

export default function Checkout() {
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({ buyer_name: '', buyer_email: '', buyer_email_confirm: '', buyer_dni: '', buyer_phone: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (!cart) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950"><Navbar />
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No tenés ninguna entrada seleccionada.</p>
        <Link to="/" className="btn-primary text-sm">Ver eventos</Link>
      </div>
    </div>
  )

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' })) }

  const validate = () => {
    const errs = {}
    if (!form.buyer_name.trim()) errs.buyer_name = 'Ingresá tu nombre completo'
    if (!form.buyer_email.trim()) errs.buyer_email = 'Ingresá tu email'
    else if (!/\S+@\S+\.\S+/.test(form.buyer_email)) errs.buyer_email = 'Email inválido'
    if (form.buyer_email !== form.buyer_email_confirm) errs.buyer_email_confirm = 'Los emails no coinciden'
    if (!form.buyer_dni.trim()) errs.buyer_dni = 'Ingresá tu DNI'
    return errs
  }

  const handleSubmit = async () => {
    const ve = validate()
    if (Object.keys(ve).length > 0) { setErrors(ve); return }
    setLoading(true)
    try {
      const result = await purchaseTicket({ ...form, event_id: cart.event.id, event_title: cart.event.title, event_date: cart.event.date, ticket_type_id: cart.ticketType.id, ticket_type_name: cart.ticketType.name, quantity: cart.quantity, total: cart.subtotal + cart.serviceFee })
      clearCart()
      navigate('/confirmacion', { state: { ticket: result.ticket } })
    } catch (err) { 
  console.error('Error en compra:', err)
  setErrors({ general: err.response?.data?.error || 'Error al procesar la compra. Intentá de nuevo.' }) 
}
    finally { setLoading(false) }
  }

  const Label = ({ children }) => <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{children}</label>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={`/eventos/${cart.event.id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">← Volver al evento</Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Completá tu compra</h1>

        {/* Resumen */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Resumen del pedido</h2>
          <div className="flex items-center gap-4 pb-4 border-b border-gray-50 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: cart.event.image_bg }}>{cart.event.image_emoji}</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{cart.event.title}</p>
              <p className="text-xs text-gray-400">{cart.ticketType.name} × {cart.quantity}</p>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="pt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
            <div className="flex justify-between text-xs text-gray-400"><span>Cargo por servicio (5%)</span><span>{formatPrice(cart.serviceFee)}</span></div>
            <div className="flex justify-between text-sm font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-50 dark:border-gray-700 mt-2">
              <span>Total</span><span>{formatPrice(cart.subtotal + cart.serviceFee)}</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tus datos</h2>
          <div className="space-y-4">
            <div><Label>Nombre completo *</Label><input name="buyer_name" value={form.buyer_name} onChange={handleChange} placeholder="Juan Pérez" className="input-field" />{errors.buyer_name && <p className="text-xs text-red-500 mt-1">{errors.buyer_name}</p>}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Email *</Label><input name="buyer_email" type="email" value={form.buyer_email} onChange={handleChange} placeholder="juan@email.com" className="input-field" />{errors.buyer_email && <p className="text-xs text-red-500 mt-1">{errors.buyer_email}</p>}</div>
              <div><Label>Confirmar email *</Label><input name="buyer_email_confirm" type="email" value={form.buyer_email_confirm} onChange={handleChange} placeholder="juan@email.com" className="input-field" />{errors.buyer_email_confirm && <p className="text-xs text-red-500 mt-1">{errors.buyer_email_confirm}</p>}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>DNI *</Label><input name="buyer_dni" value={form.buyer_dni} onChange={handleChange} placeholder="12.345.678" className="input-field" />{errors.buyer_dni && <p className="text-xs text-red-500 mt-1">{errors.buyer_dni}</p>}</div>
              <div><Label>Teléfono</Label><input name="buyer_phone" value={form.buyer_phone} onChange={handleChange} placeholder="+54 9 ..." className="input-field" /></div>
            </div>
          </div>
        </div>

        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900 rounded-xl p-4 mb-6 text-sm text-brand-700 dark:text-brand-300">
          🔧 <strong>Modo desarrollo:</strong> el pago está simulado. En producción se integrará Mercado Pago.
        </div>

        {errors.general && <p className="text-sm text-red-500 mb-4 text-center">{errors.general}</p>}

        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-base">
          {loading ? 'Procesando...' : `Confirmar y pagar ${formatPrice(cart.subtotal + cart.serviceFee)}`}
        </button>
      </div>
    </div>
  )
}
