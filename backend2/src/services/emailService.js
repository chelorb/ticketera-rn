// src/services/emailService.js
// Envía emails usando Resend (https://resend.com)
// Resend funciona via HTTPS en vez de SMTP, compatible con Render free tier.

const { Resend } = require('resend')

// Inicializamos el cliente de Resend con la API key
function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('⚠️  RESEND_API_KEY no configurada — emails se mostrarán en consola')
    return null
  }
  return new Resend(apiKey)
}

// Función base para enviar emails
async function sendEmail({ to, subject, html, attachments }) {
  const resend = getResend()

  // Modo desarrollo sin configuración: imprimir en consola
  if (!resend) {
    console.log('\n📧 EMAIL (modo desarrollo):')
    console.log('  Para:', to)
    console.log('  Asunto:', subject)
    return { id: 'dev-mode-' + Date.now() }
  }

  // El from en Resend: si no tenés dominio propio verificado,
  // usás onboarding@resend.dev para pruebas
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments,
  })

  console.log('📧 Email enviado:', result.id || result.data?.id)
  return result
}

// ── Templates de email ────────────────────────────────────────────────────────

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
          <p style="color: #6b7280;">El organizador <strong>${organizerName}</strong> envió un nuevo evento:</p>
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
          <p style="color: #6b7280;">Tu evento <strong>${eventTitle}</strong> ya está publicado y disponible para la venta.</p>
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
          <p style="color: #6b7280;">Tu evento <strong>${eventTitle}</strong> necesita algunas correcciones.</p>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">MOTIVO</p>
            <p style="margin: 0; color: #B91C1C;">${reason}</p>
          </div>
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
  const fechaFormateada = new Date(eventDate).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const totalFormateado = '$' + totalPaid.toLocaleString('es-AR')

  await sendEmail({
    to: buyerEmail,
    subject: `🎫 Tu entrada para ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:#0F6E56;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:28px;">🎟️</p>
            <h1 style="margin:8px 0 4px;color:white;font-size:22px;font-weight:700;">Tu entrada</h1>
            <p style="margin:0;color:#9FE1CB;font-size:14px;">${eventTitle}</p>
          </td>
        </tr>

        <!-- SALUDO -->
        <tr>
          <td style="background:white;padding:24px 32px 0;">
            <p style="margin:0;color:#374151;font-size:15px;">
              Hola <strong>${buyerName}</strong>, tu compra fue confirmada. 🎉
            </p>
          </td>
        </tr>

        <!-- TARJETA DE ENTRADA -->
        <tr>
          <td style="background:white;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:2px solid #E1F5EE;border-radius:12px;overflow:hidden;">

              <!-- Info del evento -->
              <tr>
                <td style="background:#F0FBF7;padding:16px 20px;border-bottom:1px dashed #9FE1CB;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0F6E56;">${eventTitle}</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;">📅 ${fechaFormateada}</p>
                </td>
              </tr>

              <!-- QR centrado -->
              <tr>
                <td style="padding:24px;text-align:center;background:white;">
                  ${qrImageBase64
                    ? `<img src="${qrImageBase64}" alt="Código QR de tu entrada"
                        style="width:200px;height:200px;display:block;margin:0 auto;border-radius:8px;" />`
                    : `<div style="width:200px;height:200px;margin:0 auto;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                        <p style="font-family:monospace;font-size:11px;color:#6b7280;word-break:break-all;padding:8px;">${qrCode}</p>
                       </div>`
                  }
                  <p style="margin:12px 0 0;font-family:monospace;font-size:11px;color:#9ca3af;letter-spacing:1px;">
                    ${qrCode}
                  </p>
                </td>
              </tr>

              <!-- Detalles -->
              <tr>
                <td style="background:#F9FAFB;padding:16px 20px;border-top:1px dashed #9FE1CB;">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="color:#9ca3af;font-size:12px;width:50%;">TIPO DE ENTRADA</td>
                      <td style="color:#9ca3af;font-size:12px;width:50%;">CANTIDAD</td>
                    </tr>
                    <tr>
                      <td style="color:#111827;font-size:14px;font-weight:700;">${ticketType}</td>
                      <td style="color:#111827;font-size:14px;font-weight:700;">${quantity}</td>
                    </tr>
                    <tr><td colspan="2" style="padding-top:12px;"></td></tr>
                    <tr>
                      <td style="color:#9ca3af;font-size:12px;">TITULAR</td>
                      <td style="color:#9ca3af;font-size:12px;">TOTAL PAGADO</td>
                    </tr>
                    <tr>
                      <td style="color:#111827;font-size:14px;font-weight:700;">${buyerName}</td>
                      <td style="color:#0F6E56;font-size:16px;font-weight:700;">${totalFormateado}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- AVISO -->
        <tr>
          <td style="background:white;padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;">
              <tr>
                <td style="padding:14px 16px;">
                  <p style="margin:0;font-size:13px;color:#92400E;">
                    ⚠️ <strong>Importante:</strong> Este QR es personal e intransferible.
                    Presentalo en pantalla o impreso a la entrada del evento.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0F6E56;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#9FE1CB;font-size:12px;">
              TicketeraRN · Sistema de gestión de entradas
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  })
}

module.exports = {
  sendOrganizerWelcome,
  sendNewEventNotification,
  sendEventApproved,
  sendEventRejected,
  sendTicketEmail,
}
