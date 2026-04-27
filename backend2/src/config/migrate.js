// src/config/migrate.js
// Crea todas las tablas de la base de datos.
// Se ejecuta con: npm run db:migrate
// Es seguro ejecutarlo varias veces (usa CREATE TABLE IF NOT EXISTS).

require('dotenv').config()
const pool = require('./database')

async function migrate() {
  console.log('🔄 Ejecutando migraciones...')

  try {
    // Usamos una transacción: si algo falla, se revierten TODOS los cambios.
    // Así nunca quedamos con la BD en un estado inconsistente.
    await pool.query('BEGIN')

    // ── Tabla: users ──────────────────────────────────────────────────────────
    // Guarda tanto admins como organizadores (diferenciados por el campo 'role')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(200) NOT NULL,
        email         VARCHAR(200) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20) NOT NULL DEFAULT 'organizer'
                      CHECK (role IN ('admin', 'organizer')),
        organization  VARCHAR(200),
        phone         VARCHAR(50),
        status        VARCHAR(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive')),
        must_change_password BOOLEAN DEFAULT true,
        created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('  ✓ Tabla users')

    // ── Tabla: events ─────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id                SERIAL PRIMARY KEY,
        title             VARCHAR(300) NOT NULL,
        description       TEXT,
        date              TIMESTAMP WITH TIME ZONE NOT NULL,
        location          VARCHAR(300) NOT NULL,
        category          VARCHAR(100) NOT NULL DEFAULT 'Otro',
        image_emoji       VARCHAR(10) DEFAULT '🎭',
        image_bg          VARCHAR(20) DEFAULT '#E1F5EE',
        image_url         TEXT,
        total_capacity    INTEGER NOT NULL DEFAULT 0,
        available_tickets INTEGER NOT NULL DEFAULT 0,
        status            VARCHAR(20) NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','pending','published','rejected','cancelled')),
        rejection_reason  TEXT,
        organizer_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('  ✓ Tabla events')

    // ── Tabla: ticket_types ───────────────────────────────────────────────────
    // Cada evento puede tener múltiples tipos de entrada (Platea, Pullman, etc.)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_types (
        id         SERIAL PRIMARY KEY,
        event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name       VARCHAR(100) NOT NULL,
        price      NUMERIC(12,2) NOT NULL DEFAULT 0,
        available  INTEGER NOT NULL DEFAULT 0,
        sold       INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('  ✓ Tabla ticket_types')

    // ── Tabla: tickets ────────────────────────────────────────────────────────
    // Una fila por entrada comprada. El qr_code es único y es lo que se escanea.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id              SERIAL PRIMARY KEY,
        event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
        ticket_type_id  INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
        buyer_name      VARCHAR(200) NOT NULL,
        buyer_email     VARCHAR(200) NOT NULL,
        buyer_dni       VARCHAR(20),
        buyer_phone     VARCHAR(50),
        quantity        INTEGER NOT NULL DEFAULT 1,
        unit_price      NUMERIC(12,2) NOT NULL,
        service_fee     NUMERIC(12,2) NOT NULL DEFAULT 0,
        total_paid      NUMERIC(12,2) NOT NULL,
        qr_code         VARCHAR(100) UNIQUE NOT NULL,
        status          VARCHAR(20) NOT NULL DEFAULT 'paid'
                        CHECK (status IN ('pending','paid','used','cancelled','refunded')),
        payment_id      VARCHAR(200),
        payment_method  VARCHAR(50) DEFAULT 'simulated',
        purchase_date   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        used_at         TIMESTAMP WITH TIME ZONE
      )
    `)
    console.log('  ✓ Tabla tickets')

    // ── Índices ───────────────────────────────────────────────────────────────
    // Los índices aceleran las búsquedas más frecuentes.
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_qr ON tickets(qr_code)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(buyer_email)`)
    console.log('  ✓ Índices creados')

    // ── Función para updated_at automático ───────────────────────────────────
    // Cada vez que se actualiza un registro, updated_at se actualiza solo.
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `)
    await pool.query(`
      CREATE OR REPLACE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `)
    await pool.query(`
      CREATE OR REPLACE TRIGGER update_events_updated_at
        BEFORE UPDATE ON events
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `)
    console.log('  ✓ Triggers updated_at')

    await pool.query('COMMIT')
    console.log('✅ Migraciones completadas exitosamente')
  } catch (err) {
    await pool.query('ROLLBACK')
    console.error('❌ Error en migración:', err.message)
    throw err
  } finally {
    await pool.end()
  }
}

migrate().catch(() => process.exit(1))
