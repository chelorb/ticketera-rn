// src/services/emailService.js
// Envía emails usando Nodemailer con Gmail.
// En desarrollo, si no hay credenciales configuradas, solo loguea el email en consola.

const nodemailer = require('nodemailer')

// Creamos el transporter (el "enviador" de emails)
// En producción usa Gmail; en desarrollo puede usar una cuenta de prueba
function createTransporter() {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASSWORD

  console.log('📧 EMAIL_USER:', emailUser || 'NO CONFIGURADO')
  console.log('📧 EMAIL_PASS:', emailPass ? `OK (${emailPass.length} chars)` : 'NO CONFIGURADA')

  if (!emailUser || emailUser === 'tu_email@gmail.com' || !emailPass || emailPass === 'sin_configurar') {
    console.log('⚠️  Email no configurado')
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })
}

// Función base para enviar emails
async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter()

  // Modo desarrollo sin configuración: imprimir en consola
  if (!transporter) {
    console.log('\n📧 EMAIL (modo desarrollo):')
    console.log('  Para:', to)
    console.log('  Asunto:', subject)
    console.log('  Contenido: [HTML omitido en consola]')
    console.log('')
    return { messageId: 'dev-mode-' + Date.now() }
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TicketeraRN <noreply@ticketera.com>',
    to,
    subject,
    html,
  })

  console.log('📧 Email enviado:', info.messageId)
  return info
}

// ── Templates de email ────────────────────────────────────────────────────────
// Cada función genera el HTML de un tipo de email específico.

// Email de bienvenida al organizador con sus credenciales
async function sendOrganizerWelcome({ name, email, tempPassword, organization }) {
  const portalUrl = `${process.env.FRONTEND_URL}/organizer/login`

  await sendEmail({
    to: email,
    subject: 'Bienvenido a TicketeraRN — Tus credenciales de acceso',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F6E56; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎟️ TicketeraRN</h1>
          <p style="color: #9FE1CB; margin: 8px 0 0;">Portal de Organizadores</p>
        </div>

        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">¡Hola, ${name}!</h2>
          <p style="color: #6b7280;">Tu cuenta de organizador para <strong>${organization}</strong> fue creada exitosamente.</p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">TUS CREDENCIALES DE ACCESO</p>
            <p style="margin: 4px 0;"><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 4px 0;"><strong>Contraseña temporal:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
          </div>

          <p style="color: #ef4444; font-size: 14px;">⚠️ Por seguridad, cambiá tu contraseña al primer ingreso.</p>

          <a href="${portalUrl}" style="display: inline-block; background: #1D9E75; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            Ingresar al portal →
          </a>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            ¿Problemas para ingresar? Respondé este email y te ayudamos.
          </p>
        </div>
      </div>
    `
  })
}

// Email al admin cuando llega un evento para revisar
async function sendNewEventNotification({ eventTitle, organizerName, adminEmail }) {
  const adminUrl = `${process.env.FRONTEND_URL}/admin/pendientes`

  await sendEmail({
    to: adminEmail,
    subject: `📋 Nuevo evento para revisar: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F6E56; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🎟️ TicketeraRN — Admin</h1>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">Nuevo evento pendiente de revisión</h2>
          <p style="color: #6b7280;">
            El organizador <strong>${organizerName}</strong> envió un nuevo evento para que lo revises:
          </p>
          <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400E;">📋 ${eventTitle}</p>
          </div>
          <a href="${adminUrl}" style="display: inline-block; background: #1D9E75; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Revisar evento →
          </a>
        </div>
      </div>
    `
  })
}

// Email al organizador cuando su evento es aprobado
async function sendEventApproved({ organizerEmail, organizerName, eventTitle, eventId }) {
  const eventUrl = `${process.env.FRONTEND_URL}/eventos/${eventId}`

  await sendEmail({
    to: organizerEmail,
    subject: `✅ Tu evento fue aprobado: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F6E56; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🎟️ TicketeraRN</h1>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">¡Tu evento fue aprobado! 🎉</h2>
          <p style="color: #6b7280;">Hola <strong>${organizerName}</strong>,</p>
          <p style="color: #6b7280;">
            Tu evento <strong>${eventTitle}</strong> fue revisado y aprobado. Ya está publicado en el sitio y disponible para la venta de entradas.
          </p>
          <a href="${eventUrl}" style="display: inline-block; background: #1D9E75; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Ver mi evento →
          </a>
        </div>
      </div>
    `
  })
}

// Email al organizador cuando su evento es rechazado
async function sendEventRejected({ organizerEmail, organizerName, eventTitle, reason }) {
  const dashboardUrl = `${process.env.FRONTEND_URL}/organizer/dashboard`

  await sendEmail({
    to: organizerEmail,
    subject: `❌ Tu evento necesita correcciones: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F6E56; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🎟️ TicketeraRN</h1>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">Tu evento necesita correcciones</h2>
          <p style="color: #6b7280;">Hola <strong>${organizerName}</strong>,</p>
          <p style="color: #6b7280;">
            Tu evento <strong>${eventTitle}</strong> fue revisado pero necesita algunas correcciones antes de publicarse.
          </p>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">MOTIVO</p>
            <p style="margin: 0; color: #B91C1C;">${reason}</p>
          </div>
          <p style="color: #6b7280;">Podés corregirlo y reenviarlo desde tu panel.</p>
          <a href="${dashboardUrl}" style="display: inline-block; background: #1D9E75; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Ir a mi panel →
          </a>
        </div>
      </div>
    `
  })
}

// Email con el QR de la entrada al comprador
async function sendTicketEmail({ buyerEmail, buyerName, eventTitle, eventDate, ticketType, quantity, totalPaid, qrCode, qrImageBase64 }) {
  await sendEmail({
    to: buyerEmail,
    subject: `🎫 Tu entrada para ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F6E56; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎟️ Tu entrada</h1>
          <p style="color: #9FE1CB; margin: 8px 0 0;">${eventTitle}</p>
        </div>

        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <p style="color: #374151;">Hola <strong>${buyerName}</strong>, tu compra fue confirmada.</p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 20px 0;">
            <div style="background: #0F6E56; padding: 16px; color: white;">
              <h2 style="margin: 0; font-size: 18px;">${eventTitle}</h2>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${new Date(eventDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style="padding: 20px; text-align: center;">
              ${qrImageBase64 ? `<img src="cid:qrcode" alt="QR Code" style="width: 180px; height: 180px;" />` : `<p style="font-family: monospace; font-size: 14px; color: #6b7280;">${qrCode}</p>`}
              <p style="font-family: monospace; font-size: 12px; color: #9ca3af; margin: 8px 0 0;">${qrCode}</p>
            </div>
            <div style="padding: 16px; border-top: 1px dashed #e5e7eb; display: flex; gap: 16px; flex-wrap: wrap;">
              <div><p style="margin:0;font-size:12px;color:#9ca3af;">Tipo</p><p style="margin:0;font-weight:bold;">${ticketType}</p></div>
              <div><p style="margin:0;font-size:12px;color:#9ca3af;">Cantidad</p><p style="margin:0;font-weight:bold;">${quantity}</p></div>
              <div><p style="margin:0;font-size:12px;color:#9ca3af;">Total pagado</p><p style="margin:0;font-weight:bold;">$${totalPaid.toLocaleString('es-AR')}</p></div>
            </div>
          </div>

          <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; margin-top: 16px;">
            <p style="margin: 0; font-size: 13px; color: #92400E;">
              ⚠️ <strong>Importante:</strong> Este QR es personal e intransferible. Presentalo en pantalla o impreso a la entrada del evento.
            </p>
          </div>
        </div>
      </div>
    `,
    // Adjuntamos el QR como imagen inline si tenemos el base64
    attachments: qrImageBase64 ? [{
      filename: 'qr-entrada.png',
      content: qrImageBase64.split('base64,')[1],
      encoding: 'base64',
      cid: 'qrcode'
    }] : []
  })
}

module.exports = {
  sendOrganizerWelcome,
  sendNewEventNotification,
  sendEventApproved,
  sendEventRejected,
  sendTicketEmail,
}
