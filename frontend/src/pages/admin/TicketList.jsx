// src/pages/admin/TicketList.jsx
// Lista de todas las entradas vendidas + Validador QR en una misma página.
// El validador permite ingresar un código manualmente (simulando el escaneo de cámara).

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllTickets, validateTicket } from '../../api'

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}
function formatPrice(n) { return '$' + n.toLocaleString('es-AR') }

const STATUS_STYLES = {
  paid:      { label: 'Pagado',   cls: 'bg-brand-50 text-brand-700' },
  used:      { label: 'Utilizado', cls: 'bg-gray-100 text-gray-500' },
  pending:   { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-50 text-red-600' },
}

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tickets') // 'tickets' | 'validator'

  // Validador QR
  const [qrInput, setQrInput] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  useEffect(() => {
    getAllTickets()
      .then(setTickets)
      .finally(() => setLoading(false))
  }, [])

  const handleValidate = async () => {
    if (!qrInput.trim()) return
    setValidating(true)
    setValidationResult(null)
    try {
      const result = await validateTicket(qrInput.trim())
      setValidationResult(result)
    } catch {
      setValidationResult({ valid: false, reason: 'Error al validar' })
    } finally {
      setValidating(false)
    }
  }

  const handleReset = () => {
    setQrInput('')
    setValidationResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <Link to="/admin" className="font-semibold text-gray-900">🎟️ TicketeraRN</Link>
        <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600">← Volver al dashboard</Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`text-sm px-4 py-2 rounded-lg transition-all ${
              activeTab === 'tickets'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎫 Entradas vendidas
          </button>
          <button
            onClick={() => setActiveTab('validator')}
            className={`text-sm px-4 py-2 rounded-lg transition-all ${
              activeTab === 'validator'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📷 Validador QR
          </button>
        </div>

        {/* ── Tab: Entradas ── */}
        {activeTab === 'tickets' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Historial de ventas</h2>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Comprador', 'Evento', 'Entrada', 'Fecha', 'Total', 'Estado', 'QR'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => {
                      const st = STATUS_STYLES[ticket.status] || STATUS_STYLES.pending
                      return (
                        <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{ticket.buyer_name}</p>
                            <p className="text-xs text-gray-400">{ticket.buyer_email}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{ticket.event_title}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {ticket.ticket_type} × {ticket.quantity}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {formatDate(ticket.purchase_date)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {formatPrice(ticket.total_paid)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-gray-400">{ticket.qr_code}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Validador ── */}
        {activeTab === 'validator' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-1">Validador de QR</h2>
              <p className="text-xs text-gray-400 mb-6">
                Ingresá el código QR manualmente o conectá un lector de QR físico.
                En producción se habilitará la cámara del dispositivo.
              </p>

              {/* Input del código QR */}
              <div className="flex gap-2 mb-4">
                <input
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleValidate()}
                  placeholder="Ej: TKT-2025-00847-A"
                  className="input-field flex-1 font-mono text-sm"
                  disabled={validating}
                />
                <button
                  onClick={handleValidate}
                  disabled={validating || !qrInput.trim()}
                  className="btn-primary text-sm px-4"
                >
                  {validating ? '...' : 'Validar'}
                </button>
              </div>

              {/* Resultado de la validación */}
              {validationResult && (
                <div className={`rounded-xl p-5 text-center ${
                  validationResult.valid
                    ? 'bg-brand-50 border border-brand-100'
                    : 'bg-red-50 border border-red-100'
                }`}>
                  <div className="text-4xl mb-3">
                    {validationResult.valid ? '✅' : '❌'}
                  </div>

                  {validationResult.valid ? (
                    <>
                      <p className="font-semibold text-brand-700 text-lg mb-2">¡Entrada válida!</p>
                      <p className="text-sm text-brand-600 font-medium">{validationResult.ticket.buyer_name}</p>
                      <p className="text-xs text-brand-500 mt-1">{validationResult.ticket.event_title}</p>
                      <p className="text-xs text-brand-500">{validationResult.ticket.ticket_type}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-red-600 text-lg mb-2">Entrada inválida</p>
                      <p className="text-sm text-red-500">{validationResult.reason}</p>
                    </>
                  )}

                  <button onClick={handleReset} className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline">
                    Validar otra entrada
                  </button>
                </div>
              )}

              {/* Instrucciones de prueba */}
              {!validationResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-400">
                  <p className="font-medium text-gray-500 mb-1">Códigos de prueba:</p>
                  <p>✅ TKT-2025-00847-A → Válida</p>
                  <p>❌ TKT-2025-00848-B → Ya utilizada</p>
                  <p>❌ Cualquier otro → No encontrada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
