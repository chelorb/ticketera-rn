// src/pages/admin/TicketList.jsx
// Lista de entradas vendidas + Validador QR con cámara real.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllTickets, validateTicket } from '../../api'
import QrScanner from '../../components/QrScanner'

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}
function formatPrice(n) { return '$' + n.toLocaleString('es-AR') }

const STATUS_STYLES = {
  paid:      { label: 'Pagado',    cls: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' },
  used:      { label: 'Utilizado', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
  pending:   { label: 'Pendiente', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
}

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tickets')

  // Validador
  const [scanMode, setScanMode] = useState('camera') // 'camera' | 'manual'
  const [manualInput, setManualInput] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [lastScanned, setLastScanned] = useState('') // Para evitar doble escaneo

  useEffect(() => {
    getAllTickets().then(setTickets).finally(() => setLoading(false))
  }, [])

  // Cuando la cámara detecta un QR
  const handleScan = async (qrCode) => {
    // Evitamos procesar el mismo QR dos veces seguidas
    if (qrCode === lastScanned || validating) return
    setLastScanned(qrCode)
    await doValidate(qrCode)
    // Permitimos escanear otro QR después de 4 segundos
    setTimeout(() => setLastScanned(''), 4000)
  }

  const handleManualValidate = async () => {
    if (!manualInput.trim()) return
    await doValidate(manualInput.trim())
  }

  const doValidate = async (qrCode) => {
    setValidating(true)
    setValidationResult(null)
    try {
      const result = await validateTicket(qrCode)
      setValidationResult({ ...result, qrCode })
    } catch {
      setValidationResult({ valid: false, reason: 'Error al validar', qrCode })
    } finally {
      setValidating(false)
    }
  }

  const resetValidator = () => {
    setValidationResult(null)
    setManualInput('')
    setLastScanned('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 h-14 flex items-center justify-between">
        <Link to="/admin" className="font-semibold text-gray-900 dark:text-white">🎟️ TicketeraRN</Link>
        <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">← Dashboard</Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {[['tickets','🎫 Entradas vendidas'],['validator','📷 Validador QR']].map(([key, label]) => (
            <button key={key} onClick={() => { setActiveTab(key); resetValidator() }}
              className={`text-sm px-4 py-2 rounded-lg transition-all ${activeTab === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Entradas ── */}
        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Historial de ventas</h2>
            </div>
            {loading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-gray-700">
                      {['Comprador', 'Evento', 'Entrada', 'Fecha', 'Total', 'Estado'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => {
                      const st = STATUS_STYLES[ticket.status] || STATUS_STYLES.pending
                      return (
                        <tr key={ticket.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{ticket.buyer_name}</p>
                            <p className="text-xs text-gray-400">{ticket.buyer_email}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{ticket.event_title}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ticket.ticket_type} × {ticket.quantity}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap text-xs">{formatDate(ticket.purchase_date)}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatPrice(ticket.total_paid)}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span></td>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Validador de entradas</h2>
              <p className="text-xs text-gray-400 mb-4">Escaneá el QR con la cámara o ingresalo manualmente</p>

              {/* Toggle cámara / manual */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 mb-4">
                {[['camera','📷 Cámara'],['manual','⌨️ Manual']].map(([key, label]) => (
                  <button key={key} onClick={() => { setScanMode(key); resetValidator() }}
                    className={`flex-1 text-sm py-2 rounded-lg transition-all ${scanMode === key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Resultado de validación */}
              {validationResult && (
                <div className={`rounded-xl p-5 text-center mb-4 ${validationResult.valid
                  ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900'}`}>
                  <div className="text-4xl mb-2">{validationResult.valid ? '✅' : '❌'}</div>
                  {validationResult.valid ? (
                    <>
                      <p className="font-bold text-brand-700 dark:text-brand-300 text-lg mb-1">¡Entrada válida!</p>
                      <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{validationResult.ticket?.buyer_name}</p>
                      <p className="text-xs text-brand-500 mt-1">{validationResult.ticket?.event_title}</p>
                      <p className="text-xs text-brand-500">{validationResult.ticket?.ticket_type}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-red-600 dark:text-red-400 text-lg mb-1">Entrada inválida</p>
                      <p className="text-sm text-red-500">{validationResult.reason}</p>
                    </>
                  )}
                  <button onClick={resetValidator}
                    className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 underline">
                    Escanear otra entrada
                  </button>
                </div>
              )}

              {/* Modo cámara */}
              {scanMode === 'camera' && !validationResult && (
                <div>
                  {validating ? (
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl h-48 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Validando...</p>
                    </div>
                  ) : (
                    <QrScanner onScan={handleScan} />
                  )}
                </div>
              )}

              {/* Modo manual */}
              {scanMode === 'manual' && !validationResult && (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualValidate()}
                      placeholder="Ej: TKT-20250614-ABC123"
                      className="input-field flex-1 font-mono text-sm"
                      disabled={validating}
                    />
                    <button onClick={handleManualValidate}
                      disabled={validating || !manualInput.trim()}
                      className="btn-primary text-sm px-4">
                      {validating ? '...' : 'Validar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
