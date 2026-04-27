// src/config/seed.js
// Carga datos iniciales en la base de datos.
// Se ejecuta con: npm run db:seed
// Crea el usuario admin y algunos eventos de ejemplo para probar.

require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('./database')

async function seed() {
  console.log('🌱 Cargando datos iniciales...')

  try {
    await pool.query('BEGIN')

    // ── Admin ─────────────────────────────────────────────────────────────────
    // bcrypt.hash() convierte la contraseña a un hash seguro.
    // El número 12 es el "salt rounds": más alto = más seguro pero más lento.
    const adminHash = await bcrypt.hash('Admin1234!', 12)

    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, organization, must_change_password)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, ['Administrador', 'admin@ticketera.com', adminHash, 'admin', 'TicketeraRN', false])
    console.log('  ✓ Admin creado: admin@ticketera.com / Admin1234!')

    // ── Organizador de prueba ─────────────────────────────────────────────────
    const orgHash = await bcrypt.hash('Organizer1234!', 12)

    const orgResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, organization, phone, must_change_password)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Teatro Municipal Bariloche', 'teatro@bariloche.gob.ar', orgHash, 'organizer', 'Municipalidad de Bariloche', '+54 294 442-0000', false])

    const organizerId = orgResult.rows[0].id
    console.log('  ✓ Organizador creado: teatro@bariloche.gob.ar / Organizer1234!')

    // ── Eventos de ejemplo ────────────────────────────────────────────────────
    const events = [
      {
        title: 'La Casa de Bernarda Alba',
        description: 'Obra cumbre de Federico García Lorca. Una producción de la Compañía Provincial de Teatro.\n\nDuración: 100 minutos sin intervalo. Apto para mayores de 13 años.',
        date: '2025-06-14T21:00:00-03:00',
        location: 'Teatro Municipal El Círculo, Bariloche',
        category: 'Teatro',
        image_emoji: '🎭',
        image_bg: '#E1F5EE',
        total_capacity: 200,
        status: 'published',
        organizer_id: null,
        tickets: [
          { name: 'Platea', price: 4500, available: 80 },
          { name: 'Pullman', price: 3200, available: 80 },
          { name: 'Paraíso', price: 2000, available: 40 },
        ]
      },
      {
        title: 'Orquesta Filarmónica de Río Negro',
        description: 'Temporada 2025. Beethoven, Sinfonía N°7 y Brahms, Concierto para piano N°2. Solista invitado: Pablo Ortiz.',
        date: '2025-06-22T19:00:00-03:00',
        location: 'Sala de Conciertos, Viedma',
        category: 'Música',
        image_emoji: '🎵',
        image_bg: '#E6F1FB',
        total_capacity: 450,
        status: 'published',
        organizer_id: null,
        tickets: [
          { name: 'General', price: 2000, available: 300 },
          { name: 'Preferencial', price: 3500, available: 150 },
        ]
      },
      {
        title: 'Festival de Jazz del Comahue',
        description: 'Tres días de jazz en el corazón de la Patagonia. Músicos locales e internacionales en un escenario al aire libre.',
        date: '2025-07-18T18:00:00-03:00',
        location: 'Anfiteatro Municipal, General Roca',
        category: 'Música',
        image_emoji: '🎷',
        image_bg: '#EAF3DE',
        total_capacity: 800,
        status: 'published',
        organizer_id: organizerId,
        tickets: [
          { name: 'Abono 3 días', price: 8000, available: 500 },
          { name: 'Día viernes', price: 3000, available: 100 },
          { name: 'Día sábado', price: 3500, available: 100 },
          { name: 'Día domingo', price: 2500, available: 100 },
        ]
      },
      {
        title: 'Tango en la Patagonia',
        description: 'Una noche de tango con los mejores bailarines de la región. Show + cena incluida.',
        date: '2025-08-10T21:00:00-03:00',
        location: 'Salón del Club Andino, Bariloche',
        category: 'Danza',
        image_emoji: '🌹',
        image_bg: '#FBEAF0',
        total_capacity: 100,
        status: 'pending',
        organizer_id: organizerId,
        tickets: [
          { name: 'General', price: 8000, available: 70 },
          { name: 'VIP con cena', price: 15000, available: 30 },
        ]
      },
    ]

    for (const event of events) {
      const total = event.tickets.reduce((sum, t) => sum + t.available, 0)
      const eventResult = await pool.query(`
        INSERT INTO events
          (title, description, date, location, category, image_emoji, image_bg,
           total_capacity, available_tickets, status, organizer_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING id
      `, [
        event.title, event.description, event.date, event.location,
        event.category, event.image_emoji, event.image_bg,
        total, total, event.status, event.organizer_id
      ])

      const eventId = eventResult.rows[0].id

      // Insertar los tipos de entrada de cada evento
      for (const ticket of event.tickets) {
        await pool.query(`
          INSERT INTO ticket_types (event_id, name, price, available)
          VALUES ($1, $2, $3, $4)
        `, [eventId, ticket.name, ticket.price, ticket.available])
      }

      console.log(`  ✓ Evento creado: ${event.title} (${event.status})`)
    }

    await pool.query('COMMIT')
    console.log('✅ Seed completado exitosamente')
    console.log('')
    console.log('Credenciales de acceso:')
    console.log('  Admin:       admin@ticketera.com     / Admin1234!')
    console.log('  Organizador: teatro@bariloche.gob.ar / Organizer1234!')
  } catch (err) {
    await pool.query('ROLLBACK')
    console.error('❌ Error en seed:', err.message)
    throw err
  } finally {
    await pool.end()
  }
}

seed().catch(() => process.exit(1))
