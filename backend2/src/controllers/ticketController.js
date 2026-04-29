// src/controllers/ticketController.js
const pool = require('../config/database')
const { generateTicketCode, generateQRBase64 } = require('../services/qrService')
const { sendTicketEmail } = require('../services/emailService')

// POST /api/tickets/purchase
// Procesa la compra de una entrada. Genera el QR y envía el email.
async function purchaseTicket(req, res) {
  const { event_id, ticket_type_id, quantity, buyer_name, buyer_email, buyer_dni, buyer_phone } = req.body

  if (!event_id || !ticket_type_id || !quantity || !buyer_name || !buyer_email) {
    return res.status(400).json({ error: 'Faltan datos requeridos' })
  }

  // Usamos una transacción con SELECT FOR UPDATE para evitar doble venta
  // (dos personas comprando el último ticket al mismo tiempo)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Bloqueamos el tipo de entrada para esta transacción
    const ttResult = await client.query(
      'SELECT * FROM ticket_types WHERE id=$1 FOR UPDATE',
      [ticket_type_id]
    )
    if (ttResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Tipo de entrada no encontrado' })
    }

    const ticketType = ttResult.rows[0]

    if (ticketType.available < quantity) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Solo quedan ${ticketType.available} entradas disponibles` })
    }

    // Obtenemos el evento
    const eventResult = await client.query('SELECT * FROM events WHERE id=$1', [event_id])
    const event = eventResult.rows[0]

    // Calculamos precios
    const unitPrice  = parseFloat(ticketType.price)
    const subtotal   = unitPrice * quantity
    const serviceFee = Math.round(subtotal * 0.05)  // 5% cargo por servicio
    const totalPaid  = subtotal + serviceFee

    // Generamos el código único del QR
    const qrCode = generateTicketCode()

    // Insertamos el ticket
    const ticketResult = await client.query(`
      INSERT INTO tickets
        (event_id, ticket_type_id, buyer_name, buyer_email, buyer_dni, buyer_phone,
         quantity, unit_price, service_fee, total_paid, qr_code, status, payment_method)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'paid','simulated')
      RETURNING *
    `, [event_id, ticket_type_id, buyer_name, buyer_email, buyer_dni, buyer_phone,
        quantity, unitPrice, serviceFee, totalPaid, qrCode])

    const ticket = ticketResult.rows[0]

    // Descontamos las entradas disponibles
    await client.query(
      'UPDATE ticket_types SET available=available-$1, sold=sold+$1 WHERE id=$2',
      [quantity, ticket_type_id]
    )
    await client.query(
      'UPDATE events SET available_tickets=available_tickets-$1 WHERE id=$2',
      [quantity, event_id]
    )

    await client.query('COMMIT')

    // Generamos el QR como imagen y enviamos el email (fuera de la transacción)
    const qrImageBase64 = await generateQRBase64(qrCode)

    sendTicketEmail({
  buyerEmail:     buyer_email,
  buyerName:      buyer_name,
  eventTitle:     event.title,
  eventDate:      event.date,
  ticketType:     ticketType.name,
  quantity,
  totalPaid,
  qrCode,
  qrImageBase64,
}).then(() => {
  console.log('✅ Email enviado a:', buyer_email)
}).catch(err => {
  console.error('❌ Error enviando email:', err.message)
  console.error('Detalle:', err)
})

    res.status(201).json({
      success: true,
      ticket: {
        id:           ticket.id,
        qr_code:      qrCode,
        qr_image:     qrImageBase64,
        buyer_name,
        buyer_email,
        event_title:  event.title,
        event_date:   event.date,
        ticket_type:  ticketType.name,
        quantity,
        total_paid:   totalPaid,
      }
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error en purchaseTicket:', err)
    res.status(500).json({ error: 'Error al procesar la compra' })
  } finally {
    client.release()
  }
}

// GET /api/admin/tickets
// Lista todos los tickets vendidos (admin)
async function getAllTickets(req, res) {
  try {
    const result = await pool.query(`
      SELECT t.*, e.title as event_title, tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      ORDER BY t.purchase_date DESC
    `)
    res.json(result.rows.map(t => ({
      ...t,
      ticket_type: t.ticket_type_name,
    })))
  } catch (err) {
    console.error('Error en getAllTickets:', err)
    res.status(500).json({ error: 'Error al obtener tickets' })
  }
}

// POST /api/tickets/validate
// Valida un QR en la puerta del evento
async function validateTicket(req, res) {
  const { qr_code } = req.body

  if (!qr_code) {
    return res.status(400).json({ error: 'Código QR requerido' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `SELECT t.*, e.title as event_title, tt.name as ticket_type
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN ticket_types tt ON t.ticket_type_id = tt.id
       WHERE t.qr_code = $1 FOR UPDATE`,
      [qr_code]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.json({ valid: false, reason: 'Código QR no encontrado' })
    }

    const ticket = result.rows[0]

    if (ticket.status === 'used') {
      await client.query('ROLLBACK')
      return res.json({
        valid: false,
        reason: 'Entrada ya utilizada',
        used_at: ticket.used_at,
      })
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      await client.query('ROLLBACK')
      return res.json({ valid: false, reason: 'Entrada cancelada' })
    }

    // Marcamos el ticket como usado
    await client.query(
      "UPDATE tickets SET status='used', used_at=NOW() WHERE qr_code=$1",
      [qr_code]
    )

    await client.query('COMMIT')

    res.json({
      valid: true,
      ticket: {
        buyer_name:  ticket.buyer_name,
        event_title: ticket.event_title,
        ticket_type: ticket.ticket_type,
        quantity:    ticket.quantity,
      }
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error en validateTicket:', err)
    res.status(500).json({ error: 'Error al validar el ticket' })
  } finally {
    client.release()
  }
}

module.exports = { purchaseTicket, getAllTickets, validateTicket }


// ─────────────────────────────────────────────────────────────────────────────
// src/controllers/organizerController.js (en el mismo archivo para simplificar)
// ─────────────────────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs')
const { sendOrganizerWelcome } = require('../services/emailService')

// GET /api/admin/organizers
async function getOrganizers(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, organization, phone, status, created_at FROM users WHERE role='organizer' ORDER BY created_at DESC"
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error en getOrganizers:', err)
    res.status(500).json({ error: 'Error al obtener organizadores' })
  }
}

// POST /api/admin/organizers
// Crea un organizador y le envía el email con credenciales
async function createOrganizer(req, res) {
  const { name, email, organization, phone } = req.body

  if (!name || !email || !organization) {
    return res.status(400).json({ error: 'Nombre, email y organización son requeridos' })
  }

  // Generamos contraseña temporal: letras + números + símbolo
  const tempPassword = 'Temp' + Math.random().toString(36).slice(2, 8) + '!'
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  try {
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, organization, phone, must_change_password)
      VALUES ($1, $2, $3, 'organizer', $4, $5, true)
      RETURNING id, name, email, organization, phone, status, created_at
    `, [name, email.toLowerCase().trim(), passwordHash, organization, phone])

    const organizer = result.rows[0]

    // Enviamos el email de bienvenida con las credenciales
    sendOrganizerWelcome({
      name, email, tempPassword, organization,
    }).catch(err => console.error('Error enviando email de bienvenida:', err))

    res.status(201).json({
      organizer,
      temp_password: tempPassword,  // Lo devolvemos para que el admin pueda copiarlo
    })
  } catch (err) {
    if (err.code === '23505') {  // unique_violation en PostgreSQL
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' })
    }
    console.error('Error en createOrganizer:', err)
    res.status(500).json({ error: 'Error al crear el organizador' })
  }
}

// DELETE /api/admin/organizers/:id
async function deleteOrganizer(req, res) {
  const { id } = req.params
  try {
    await pool.query("UPDATE users SET status='inactive' WHERE id=$1 AND role='organizer'", [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Error en deleteOrganizer:', err)
    res.status(500).json({ error: 'Error al eliminar el organizador' })
  }
}

module.exports.getOrganizers  = getOrganizers
module.exports.createOrganizer = createOrganizer
module.exports.deleteOrganizer = deleteOrganizer
