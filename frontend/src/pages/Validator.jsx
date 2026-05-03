// src/pages/Validator.jsx
// Página de validación QR para el portero del evento.
// Acceso con PIN simple — no requiere ser admin.
// URL: /validador
// El admin le comparte esta URL y el PIN al portero antes del evento.

import { useState } from 'react'
import { validateTicket } from '../api'
import QrScanner from '../components/QrScanner'
import { useTheme } from '../context/ThemeContext'

// PIN de acceso — en producción esto debería venir de una variable de entorno
// o ser configurable desde el panel admin
const VALIDATOR_PIN = '1234'

export default function Validator() {
  const { isDark, toggleTheme } = useTheme()

  // Estados de autenticación con PIN
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  // Estados del validador
  const [scanMode, setScanMode] = useState('camera')
  const [manualInput, setManualInput] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [lastScanned, setLastScanned] = useState('')
  const [scanCount, setScanCount] = useState(0) // Contador de escaneos del turno

  const handlePinSubmit = e => {
    e.preventDefault()
    if (pinInput === VALIDATOR_PIN) {
      setAuthenticated(true)
    } else {
      setPinError('PIN incorrecto')
      setPinInput('')
    }
  }

  const handleScan = async (qrCode) => {
    if (qrCode === lastScanned || validating) return
    setLastScanned(qrCode)
    await doValidate(qrCode)
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
      if (result.valid) setScanCount(prev => prev + 1)
    } catch {
      setValidationResult({ valid: false, reason: 'Error de conexión', qrCode })
    } finally {
      setValidating(false)
    }
  }

  const resetValidator = () => {
    setValidationResult(null)
    setManualInput('')
    setLastScanned('')
  }

  // ── Pantalla de PIN ────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-5xl">🚪</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-3">
              Validador de entradas
            </h1>
            <p className="text-sm text-gray-400 mt-1">TicketeraRN</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 text-center">Ingresá el PIN</h2>
            <p className="text-xs text-gray-400 text-center mb-5">
              El organizador del evento te proporcionó un PIN de acceso
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError('') }}
                placeholder="••••"
                className="input-field text-center text-2xl tracking-widest"
                maxLength={6}
                autoFocus
              />
              {pinError && <p className="text-xs text-red-500 text-center">{pinError}</p>}
              <button type="submit" className="btn-primary w-full">
                Ingresar
              </button>
            </form>
          </div>

          {/* Botón tema discreto */}
          <div className="text-center mt-4">
            <button onClick={toggleTheme} className="text-xs text-gray-300 dark:text-gray-600 hover:text-gray-400">
              {isDark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Pantalla de validación ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar simple */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚪</span>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Validador</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Contador de entradas validadas en el turno */}
          {scanCount > 0 && (
            <span className="bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-medium px-2.5 py-1 rounded-full">
              ✅ {scanCount} validadas
            </span>
          )}
          <button onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setAuthenticated(false)}
            className="text-xs text-gray-400 hover:text-red-500">
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">

        {/* Toggle cámara / manual */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
          {[['camera','📷 Cámara'],['manual','⌨️ Manual']].map(([key, label]) => (
            <button key={key} onClick={() => { setScanMode(key); resetValidator() }}
              className={`flex-1 text-sm py-2.5 rounded-lg transition-all font-medium ${scanMode === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Resultado */}
        {validationResult && (
          <div className={`rounded-2xl p-6 text-center mb-5 ${validationResult.valid
            ? 'bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-200 dark:border-brand-800'
            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'}`}>
            <div className="text-5xl mb-3">{validationResult.valid ? '✅' : '❌'}</div>
            {validationResult.valid ? (
              <>
                <p className="font-bold text-brand-700 dark:text-brand-300 text-xl mb-2">¡VÁLIDA!</p>
                <p className="font-semibold text-brand-600 dark:text-brand-400 text-lg">{validationResult.ticket?.buyer_name}</p>
                <p className="text-sm text-brand-500 mt-1">{validationResult.ticket?.event_title}</p>
                <p className="text-sm text-brand-500">{validationResult.ticket?.ticket_type}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-red-600 dark:text-red-400 text-xl mb-2">INVÁLIDA</p>
                <p className="text-red-500">{validationResult.reason}</p>
              </>
            )}
            <button onClick={resetValidator}
              className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium ${validationResult.valid
                ? 'bg-brand-500 hover:bg-brand-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              Escanear siguiente
            </button>
          </div>
        )}

        {/* Cámara */}
        {scanMode === 'camera' && !validationResult && (
          validating ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-56 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Validando entrada...</p>
            </div>
          ) : (
            <QrScanner onScan={handleScan} />
          )
        )}

        {/* Manual */}
        {scanMode === 'manual' && !validationResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Ingresá el código QR de la entrada:</p>
            <div className="flex gap-2">
              <input
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualValidate()}
                placeholder="TKT-20250614-ABC123"
                className="input-field flex-1 font-mono text-sm"
                disabled={validating}
                autoFocus
              />
              <button onClick={handleManualValidate}
                disabled={validating || !manualInput.trim()}
                className="btn-primary text-sm px-4">
                {validating ? '...' : 'OK'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
