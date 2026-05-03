// src/components/QrScanner.jsx
// Componente reutilizable de escaneo QR con la cámara del dispositivo.
// Usa html5-qrcode que maneja automáticamente los permisos de cámara
// y funciona en todos los navegadores modernos (Chrome, Safari, Firefox).

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null)      // Instancia del scanner
  const containerId = 'qr-reader'     // ID del div donde se monta la cámara
  const [started, setStarted]   = useState(false)
  const [cameras, setCameras]   = useState([])
  const [activeCamera, setActiveCamera] = useState(null)
  const [permissionError, setPermissionError] = useState(false)

  // Al montar el componente, iniciamos el scanner
  useEffect(() => {
    startScanner()
    // Al desmontar, detenemos la cámara para liberar el recurso
    return () => stopScanner()
  }, [])

  const startScanner = async () => {
    try {
      // Pedimos la lista de cámaras disponibles
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        setPermissionError(true)
        return
      }
      setCameras(devices)

      // Preferimos la cámara trasera (environment) para celulares
      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('trasera') ||
        d.label.toLowerCase().includes('environment')
      )
      const selectedCamera = backCamera || devices[0]
      setActiveCamera(selectedCamera.id)

      // Creamos la instancia del scanner
      scannerRef.current = new Html5Qrcode(containerId)

      await scannerRef.current.start(
        selectedCamera.id,
        {
          fps: 10,          // Frames por segundo para detección
          qrbox: { width: 250, height: 250 }, // Área de escaneo
          aspectRatio: 1.0,
        },
        // Callback cuando detecta un QR exitosamente
        (decodedText) => {
          onScan(decodedText)
        },
        // Callback de error (se llama constantemente mientras busca, es normal ignorarlo)
        () => {}
      )
      setStarted(true)
    } catch (err) {
      console.error('Error iniciando scanner:', err)
      if (err.toString().includes('permission') || err.toString().includes('NotAllowed')) {
        setPermissionError(true)
      }
      if (onError) onError(err)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && started) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (e) {
        // Ignoramos errores al detener (puede ya estar detenido)
      }
    }
  }

  // Cambiar entre cámaras (útil si el celular tiene varias)
  const switchCamera = async (cameraId) => {
    await stopScanner()
    setStarted(false)
    setActiveCamera(cameraId)
    setTimeout(async () => {
      scannerRef.current = new Html5Qrcode(containerId)
      await scannerRef.current.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => onScan(decodedText),
        () => {}
      )
      setStarted(true)
    }, 300)
  }

  if (permissionError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-2xl p-6 text-center">
        <p className="text-3xl mb-3">📷</p>
        <p className="font-medium text-red-700 dark:text-red-400 mb-2">Sin acceso a la cámara</p>
        <p className="text-sm text-red-500 dark:text-red-400 mb-4">
          El navegador bloqueó el acceso. Por favor habilitá la cámara en la configuración del navegador y recargá la página.
        </p>
        <button onClick={() => window.location.reload()}
          className="btn-primary text-sm">
          Recargar página
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Selector de cámara si hay más de una */}
      {cameras.length > 1 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {cameras.map(cam => (
            <button key={cam.id} onClick={() => switchCamera(cam.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeCamera === cam.id
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {cam.label.length > 20 ? cam.label.substring(0, 20) + '...' : cam.label}
            </button>
          ))}
        </div>
      )}

      {/* Contenedor de la cámara — html5-qrcode lo maneja internamente */}
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <div id={containerId} style={{ width: '100%' }} />
        {/* Overlay con guías de escaneo */}
        {started && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-white/50 rounded-2xl relative">
              {/* Esquinas decorativas */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
            </div>
          </div>
        )}
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-white text-sm">Iniciando cámara...</p>
          </div>
        )}
      </div>

      {started && (
        <p className="text-xs text-center text-gray-400 mt-2">
          Apuntá la cámara al código QR de la entrada
        </p>
      )}
    </div>
  )
}
