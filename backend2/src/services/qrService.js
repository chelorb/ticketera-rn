// src/services/qrService.js
// Genera códigos QR únicos para cada entrada.
// El QR contiene el código único del ticket que se escanea en la puerta.

const QRCode = require('qrcode')
const { v4: uuidv4 } = require('uuid')

// Genera un código único para el ticket
// Formato: TKT-YYYYMMDD-XXXXXXXX (fácil de leer si se necesita ingresar manual)
function generateTicketCode() {
  const date = new Date()
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')
  // uuid v4 genera un ID aleatorio único. Tomamos los primeros 8 caracteres en mayúsculas.
  const uniquePart = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase()
  return `TKT-${dateStr}-${uniquePart}`
}

// Genera el QR como imagen PNG en base64
// El base64 se puede incrustar directamente en emails o guardar en disco
async function generateQRBase64(ticketCode) {
  const qrDataUrl = await QRCode.toDataURL(ticketCode, {
    errorCorrectionLevel: 'H',  // Alto nivel de corrección (más robusto)
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#0F6E56',   // Color del QR (verde oscuro de la marca)
      light: '#FFFFFF',  // Fondo blanco
    },
  })
  return qrDataUrl
}

// Genera el QR como Buffer PNG (para guardar en disco o enviar como archivo)
async function generateQRBuffer(ticketCode) {
  return QRCode.toBuffer(ticketCode, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
  })
}

module.exports = {
  generateTicketCode,
  generateQRBase64,
  generateQRBuffer,
}
