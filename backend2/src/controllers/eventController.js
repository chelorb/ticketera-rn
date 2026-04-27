// src/controllers/eventController.js
// Toda la lógica de negocio relacionada con eventos.

const pool = require('../config/database')
const emailService = require('../services/emailService')

// Función auxiliar: trae los ticket_types de un evento
async function getTicketTypes(eventId) {
  const result = await pool.query(
    'SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY price ASC',
    [eventId]
  )
  return result.rows
}

// Función auxiliar: construye el objeto evento completo con sus ticket_types
async function buildEventWithTickets(event) {
  const ticketTypes = await getTicketTypes(event.id)
  return { ...event, ticket_types: ticketTypes }
}

// ─── RUTAS PÚBLICAS ───────────────────────────────────────────────────────────

// GET /api/events
// Devuelve todos los eventos publicados (vista pública)
async function getPublicEvents(req, res) {
  try {
    const result = await pool.query(`
      SELECT e.*, u.name as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.status = 'published'
      ORDER BY e.date ASC
    `)

    // Para cada evento, traemos sus tipos de entrada
    const events = await Promise.all(result.rows.map(buildEventWithTickets))
    res.json(events)
  } catch (err) {
    console.error('Error en getPublicEvents:', err)
    res.status(500).json({ error: 'Error al obtener eventos' })
  }
}

// GET /api/events/:id
// Devuelve el detalle de un evento publicado
async function getPublicEvent(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as organizer_name
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1 AND e.status = 'published'`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' })
    }

    const event = await buildEventWithTickets(result.rows[0])
    res.json(event)
  } catch (err) {
    console.error('Error en getPublicEvent:', err)
    res.status(500).json({ error: 'Error al obtener el evento' })
  }
}

// ─── RUTAS ADMIN ──────────────────────────────────────────────────────────────

// GET /api/admin/events
// Devuelve TODOS los eventos (admin ve todos los estados)
async function getAllEvents(req, res) {
  try {
    const result = await pool.query(`
      SELECT e.*, u.name as organizer_name, u.organization as organizer_org
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      ORDER BY e.created_at DESC
    `)
    const events = await Promise.all(result.rows.map(buildEventWithTickets))
    res.json(events)
  } catch (err) {
    console.error('Error en getAllEvents:', err)
    res.status(500).json({ error: 'Error al obtener eventos' })
  }
}

// GET /api/admin/events/pending
// Solo los eventos pendientes de revisión
async function getPendingEvents(req, res) {
  try {
    const result = await pool.query(`
      SELECT e.*, u.name as organizer_name, u.email as organizer_email, u.organization as organizer_org
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.status = 'pending'
      ORDER BY e.created_at ASC
    `)
    const events = await Promise.all(result.rows.map(buildEventWithTickets))
    res.json(events)
  } catch (err) {
    console.error('Error en getPendingEvents:', err)
    res.status(500).json({ error: 'Error al obtener eventos pendientes' })
  }
}

// POST /api/admin/events
// El admin crea un evento directamente (status puede ser cualquiera)
async function createEvent(req, res) {
  const { title, description, date, location, category, image_emoji, image_bg, image_url, total_capacity, status, ticket_types } = req.body

  if (!title || !date || !location || !ticket_types?.length) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const available = ticket_types.reduce((sum, tt) => sum + Number(tt.available), 0)

    const eventResult = await client.query(`
      INSERT INTO events (title, description, date, location, category, image_emoji, image_bg, image_url, total_capacity, available_tickets, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [title, description, date, location, category || 'Otro', image_emoji || '🎭', image_bg || '#E1F5EE', image_url || null, total_capacity || available, available, status || 'draft'])

    const event = eventResult.rows[0]

    for (const tt of ticket_types) {
      await client.query(
        'INSERT INTO ticket_types (event_id, name, price, available) VALUES ($1,$2,$3,$4)',
        [event.id, tt.name, Number(tt.price), Number(tt.available)]
      )
    }

    await client.query('COMMIT')
    const fullEvent = await buildEventWithTickets(event)
    res.status(201).json(fullEvent)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error en createEvent:', err)
    res.status(500).json({ error: 'Error al crear el evento' })
  } finally {
    client.release()
  }
}

// PUT /api/admin/events/:id
// El admin edita un evento
async function updateEvent(req, res) {
  const { id } = req.params
  const { title, description, date, location, category, image_emoji, image_bg, image_url, total_capacity, status, ticket_types } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      UPDATE events SET
        title=$1, description=$2, date=$3, location=$4, category=$5,
        image_emoji=$6, image_bg=$7, image_url=$8, total_capacity=$9, status=$10
      WHERE id=$11
    `, [title, description, date, location, category, image_emoji, image_bg, image_url, total_capacity, status, id])

    // Si se envían ticket_types, los reemplazamos todos
    if (ticket_types?.length) {
      await client.query('DELETE FROM ticket_types WHERE event_id = $1', [id])
      for (const tt of ticket_types) {
        await client.query(
          'INSERT INTO ticket_types (event_id, name, price, available) VALUES ($1,$2,$3,$4)',
          [id, tt.name, Number(tt.price), Number(tt.available)]
        )
      }
      const available = ticket_types.reduce((sum, tt) => sum + Number(tt.available), 0)
      await client.query('UPDATE events SET available_tickets=$1 WHERE id=$2', [available, id])
    }

    await client.query('COMMIT')
    const result = await pool.query('SELECT * FROM events WHERE id=$1', [id])
    const fullEvent = await buildEventWithTickets(result.rows[0])
    res.json(fullEvent)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error en updateEvent:', err)
    res.status(500).json({ error: 'Error al actualizar el evento' })
  } finally {
    client.release()
  }
}

// DELETE /api/admin/events/:id
async function deleteEvent(req, res) {
  const { id } = req.params
  try {
    // Verificamos que no tenga tickets vendidos antes de eliminar
    const tickets = await pool.query(
      "SELECT COUNT(*) FROM tickets WHERE event_id=$1 AND status NOT IN ('cancelled','refunded')",
      [id]
    )
    if (parseInt(tickets.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un evento con entradas vendidas' })
    }
    await pool.query('DELETE FROM events WHERE id=$1', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Error en deleteEvent:', err)
    res.status(500).json({ error: 'Error al eliminar el evento' })
  }
}

// POST /api/admin/events/:id/approve
// Aprueba un evento pendiente y notifica al organizador
async function approveEvent(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      "UPDATE events SET status='published' WHERE id=$1 AND status='pending' RETURNING *",
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado o no está pendiente' })
    }

    const event = result.rows[0]

    // Notificamos al organizador si tiene email
    if (event.organizer_id) {
      const orgResult = await pool.query('SELECT name, email FROM users WHERE id=$1', [event.organizer_id])
      if (orgResult.rows.length > 0) {
        const org = orgResult.rows[0]
        // No bloqueamos la respuesta si el email falla
        emailService.sendEventApproved({
          organizerEmail: org.email,
          organizerName:  org.name,
          eventTitle:     event.title,
          eventId:        event.id,
        }).catch(err => console.error('Error enviando email de aprobación:', err))
      }
    }

    res.json(event)
  } catch (err) {
    console.error('Error en approveEvent:', err)
    res.status(500).json({ error: 'Error al aprobar el evento' })
  }
}

// POST /api/admin/events/:id/reject
// Rechaza un evento con un motivo y notifica al organizador
async function rejectEvent(req, res) {
  const { id } = req.params
  const { reason } = req.body

  if (!reason?.trim()) {
    return res.status(400).json({ error: 'El motivo de rechazo es requerido' })
  }

  try {
    const result = await pool.query(
      "UPDATE events SET status='rejected', rejection_reason=$1 WHERE id=$2 AND status='pending' RETURNING *",
      [reason, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado o no está pendiente' })
    }

    const event = result.rows[0]

    if (event.organizer_id) {
      const orgResult = await pool.query('SELECT name, email FROM users WHERE id=$1', [event.organizer_id])
      if (orgResult.rows.length > 0) {
        const org = orgResult.rows[0]
        emailService.sendEventRejected({
          organizerEmail: org.email,
          organizerName:  org.name,
          eventTitle:     event.title,
          reason,
        }).catch(err => console.error('Error enviando email de rechazo:', err))
      }
    }

    res.json(event)
  } catch (err) {
    console.error('Error en rejectEvent:', err)
    res.status(500).json({ error: 'Error al rechazar el evento' })
  }
}

// ─── RUTAS ORGANIZADOR ────────────────────────────────────────────────────────

// GET /api/organizer/events
// El organizador ve solo sus propios eventos
async function getOrganizerEvents(req, res) {
  const organizerId = req.user.id
  try {
    const result = await pool.query(
      'SELECT * FROM events WHERE organizer_id=$1 ORDER BY created_at DESC',
      [organizerId]
    )
    const events = await Promise.all(result.rows.map(buildEventWithTickets))
    res.json(events)
  } catch (err) {
    console.error('Error en getOrganizerEvents:', err)
    res.status(500).json({ error: 'Error al obtener eventos' })
  }
}

// POST /api/organizer/events
// El organizador envía un evento para revisión
async function submitEvent(req, res) {
  const organizerId = req.user.id
  const { title, description, date, location, category, image_emoji, image_bg, image_url, ticket_types } = req.body

  if (!title || !date || !location || !description || !ticket_types?.length) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const available = ticket_types.reduce((sum, tt) => sum + Number(tt.available), 0)

    const eventResult = await client.query(`
      INSERT INTO events (title, description, date, location, category, image_emoji, image_bg, image_url, total_capacity, available_tickets, status, organizer_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11)
      RETURNING *
    `, [title, description, date, location, category || 'Otro', image_emoji || '🎭', image_bg || '#E1F5EE', image_url || null, available, available, organizerId])

    const event = eventResult.rows[0]

    for (const tt of ticket_types) {
      await client.query(
        'INSERT INTO ticket_types (event_id, name, price, available) VALUES ($1,$2,$3,$4)',
        [event.id, tt.name, Number(tt.price), Number(tt.available)]
      )
    }

    await client.query('COMMIT')

    // Notificamos al admin
    const adminResult = await pool.query("SELECT email FROM users WHERE role='admin' LIMIT 1")
    if (adminResult.rows.length > 0) {
      emailService.sendNewEventNotification({
        eventTitle:     title,
        organizerName:  req.user.name,
        adminEmail:     adminResult.rows[0].email,
      }).catch(err => console.error('Error enviando notificación al admin:', err))
    }

    const fullEvent = await buildEventWithTickets(event)
    res.status(201).json(fullEvent)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error en submitEvent:', err)
    res.status(500).json({ error: 'Error al enviar el evento' })
  } finally {
    client.release()
  }
}

// PUT /api/organizer/events/:id/resubmit
// El organizador corrige y reenvía un evento rechazado
async function resubmitEvent(req, res) {
  const { id } = req.params
  const organizerId = req.user.id
  const { title, description, date, location, category, image_emoji, image_bg, image_url, ticket_types } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verificamos que el evento pertenece al organizador y está rechazado
    const check = await client.query(
      "SELECT id FROM events WHERE id=$1 AND organizer_id=$2 AND status='rejected'",
      [id, organizerId]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado o no está rechazado' })
    }

    const available = ticket_types.reduce((sum, tt) => sum + Number(tt.available), 0)

    await client.query(`
      UPDATE events SET
        title=$1, description=$2, date=$3, location=$4, category=$5,
        image_emoji=$6, image_bg=$7, image_url=$8,
        total_capacity=$9, available_tickets=$10,
        status='pending', rejection_reason=NULL
      WHERE id=$11
    `, [title, description, date, location, category, image_emoji, image_bg, image_url, available, available, id])

    await client.query('DELETE FROM ticket_types WHERE event_id=$1', [id])
    for (const tt of ticket_types) {
      await client.query(
        'INSERT INTO ticket_types (event_id, name, price, available) VALUES ($1,$2,$3,$4)',
        [id, tt.name, Number(tt.price), Number(tt.available)]
      )
    }

    await client.query('COMMIT')

    // Notificamos al admin del reenvío
    const adminResult = await pool.query("SELECT email FROM users WHERE role='admin' LIMIT 1")
    if (adminResult.rows.length > 0) {
      emailService.sendNewEventNotification({
        eventTitle:    title,
        organizerName: req.user.name,
        adminEmail:    adminResult.rows[0].email,
      }).catch(err => console.error('Error notificando al admin:', err))
    }

    const result = await pool.query('SELECT * FROM events WHERE id=$1', [id])
    const fullEvent = await buildEventWithTickets(result.rows[0])
    res.json(fullEvent)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error en resubmitEvent:', err)
    res.status(500).json({ error: 'Error al reenviar el evento' })
  } finally {
    client.release()
  }
}

// GET /api/admin/stats
// Estadísticas para el dashboard
async function getDashboardStats(req, res) {
  try {
    const [activeEvents, ticketsSold, revenue, pendingApproval, pendingValidation] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM events WHERE status='published'"),
      pool.query("SELECT COALESCE(SUM(quantity),0) as total FROM tickets WHERE status='paid'"),
      pool.query("SELECT COALESCE(SUM(total_paid),0) as total FROM tickets WHERE status='paid' AND purchase_date >= date_trunc('month', NOW())"),
      pool.query("SELECT COUNT(*) FROM events WHERE status='pending'"),
      pool.query("SELECT COUNT(*) FROM tickets WHERE status='paid'"),
    ])

    res.json({
      active_events:      parseInt(activeEvents.rows[0].count),
      tickets_sold:       parseInt(ticketsSold.rows[0].total),
      monthly_revenue:    parseFloat(revenue.rows[0].total),
      pending_approval:   parseInt(pendingApproval.rows[0].count),
      pending_validation: parseInt(pendingValidation.rows[0].count),
    })
  } catch (err) {
    console.error('Error en getDashboardStats:', err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

module.exports = {
  getPublicEvents, getPublicEvent,
  getAllEvents, getPendingEvents, createEvent, updateEvent, deleteEvent,
  approveEvent, rejectEvent,
  getOrganizerEvents, submitEvent, resubmitEvent,
  getDashboardStats,
}
