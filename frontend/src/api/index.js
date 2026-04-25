// src/api/index.js
// Este archivo centraliza TODAS las llamadas al backend.
// Por ahora usa datos MOCK (simulados). Cuando el backend esté listo,
// solo hay que cambiar las funciones aquí y el resto de la app no cambia.

import axios from 'axios'

// ─── Configuración de Axios ───────────────────────────────────────────────────
// Axios es la librería que usamos para hacer llamadas HTTP (GET, POST, etc.)
// Creamos una instancia configurada una sola vez y la exportamos.

const api = axios.create({
  baseURL: '/api',          // Vite redirige /api → http://localhost:3001 (ver vite.config.js)
  timeout: 10000,           // Si el servidor no responde en 10 seg, falla con error
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: antes de CADA request, adjunta el token JWT si existe.
// El token se guarda en localStorage cuando el admin hace login.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


// ─── Datos MOCK ───────────────────────────────────────────────────────────────
// Estos datos simulan lo que devolvería el backend real.
// Cuando el backend esté listo, borramos esta sección y descomentamos las
// funciones reales de abajo.

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'La Casa de Bernarda Alba',
    description: 'Obra cumbre de Federico García Lorca. Una producción de la Compañía Provincial de Teatro que recorre los temas del autoritarismo, la libertad y el deseo reprimido en una puesta en escena contemporánea. Con dirección de Marcela Ríos y elenco provincial.\n\nDuración: 100 minutos sin intervalo. Apto para mayores de 13 años.',
    date: '2025-06-14T21:00:00',
    location: 'Teatro Municipal El Círculo, Bariloche',
    category: 'Teatro',
    image_emoji: '🎭',
    image_bg: '#E1F5EE',
    total_capacity: 200,
    available_tickets: 124,
    status: 'published',
    ticket_types: [
      { id: 1, name: 'Platea', price: 4500, available: 80 },
      { id: 2, name: 'Pullman', price: 3200, available: 30 },
      { id: 3, name: 'Paraíso', price: 2000, available: 14 },
    ],
  },
  {
    id: 2,
    title: 'Orquesta Filarmónica de Río Negro',
    description: 'Temporada 2025. Programa: Beethoven, Sinfonía N°7 y Brahms, Concierto para piano N°2. Solista invitado: Pablo Ortiz. Una velada imperdible para los amantes de la música clásica en la capital provincial.',
    date: '2025-06-22T19:00:00',
    location: 'Sala de Conciertos, Viedma',
    category: 'Música',
    image_emoji: '🎵',
    image_bg: '#E6F1FB',
    total_capacity: 450,
    available_tickets: 312,
    status: 'published',
    ticket_types: [
      { id: 4, name: 'General', price: 2000, available: 200 },
      { id: 5, name: 'Preferencial', price: 3500, available: 112 },
    ],
  },
  {
    id: 3,
    title: 'Ballet Clásico: Giselle',
    description: 'El Ballet Estable de Río Negro presenta Giselle, uno de los títulos más románticos del repertorio clásico. Coreografía basada en la versión de Marius Petipa, con escenografía y vestuario diseñados especialmente para esta producción.',
    date: '2025-06-27T20:30:00',
    location: 'Centro Cultural, Cipolletti',
    category: 'Danza',
    image_emoji: '💃',
    image_bg: '#FBEAF0',
    total_capacity: 180,
    available_tickets: 180,
    status: 'published',
    ticket_types: [
      { id: 6, name: 'General', price: 6000, available: 120 },
      { id: 7, name: 'VIP', price: 9500, available: 60 },
    ],
  },
  {
    id: 4,
    title: 'Gala Empresarial 2025',
    description: 'Evento privado de gala organizado por la Cámara de Comercio de Neuquén. Cena, música en vivo y premiación a empresas destacadas del año. Dress code: formal.',
    date: '2025-07-03T22:00:00',
    location: 'Hotel Patagonia Grand, Neuquén',
    category: 'Privado',
    image_emoji: '🎊',
    image_bg: '#FAEEDA',
    total_capacity: 120,
    available_tickets: 31,
    status: 'published',
    ticket_types: [
      { id: 8, name: 'Individual', price: 12000, available: 31 },
    ],
  },
  {
    id: 5,
    title: 'Festival de Jazz del Comahue',
    description: 'Tres días de jazz en el corazón de la Patagonia. Músicos locales e internacionales en un escenario al aire libre. Edición 2025 con más de 20 artistas confirmados.',
    date: '2025-07-18T18:00:00',
    location: 'Anfiteatro Municipal, General Roca',
    category: 'Música',
    image_emoji: '🎷',
    image_bg: '#EAF3DE',
    total_capacity: 800,
    available_tickets: 650,
    status: 'published',
    ticket_types: [
      { id: 9, name: 'Abono 3 días', price: 8000, available: 400 },
      { id: 10, name: 'Día viernes', price: 3000, available: 100 },
      { id: 11, name: 'Día sábado', price: 3500, available: 100 },
      { id: 12, name: 'Día domingo', price: 2500, available: 50 },
    ],
  },
  {
    id: 6,
    title: 'Exposición: Patagonia Viva',
    description: 'Muestra fotográfica itinerante de la naturaleza patagónica. Más de 80 fotografías de paisajes, fauna y pueblos originarios de la región. Entrada libre y gratuita.',
    date: '2025-07-25T10:00:00',
    location: 'Museo de Arte Contemporáneo, Bariloche',
    category: 'Arte',
    image_emoji: '🖼️',
    image_bg: '#FAECE7',
    total_capacity: 500,
    available_tickets: 500,
    status: 'published',
    ticket_types: [
      { id: 13, name: 'Entrada libre', price: 0, available: 500 },
    ],
  },
]

const MOCK_STATS = {
  active_events: 8,
  tickets_sold: 1247,
  monthly_revenue: 2430000,
  pending_validation: 23,
}

// Simula un delay de red (200ms) para que parezca una llamada real
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))


// ─── FUNCIONES DE API ─────────────────────────────────────────────────────────
// Cada función corresponde a un endpoint del backend.
// MODO MOCK: retornan datos simulados.
// MODO REAL: descomentar las líneas con api.get/post/etc.

// --- Eventos ---

/**
 * Trae todos los eventos publicados (vista pública)
 * Backend real: GET /api/events
 */
export async function getEvents() {
  await delay()
  return MOCK_EVENTS.filter(e => e.status === 'published')
  // return (await api.get('/events')).data
}

/**
 * Trae todos los eventos (admin, incluye borradores)
 * Backend real: GET /api/events/all
 */
export async function getAllEvents() {
  await delay()
  return MOCK_EVENTS
  // return (await api.get('/events/all')).data
}

/**
 * Trae un evento por ID
 * @param {number} id - ID del evento
 * Backend real: GET /api/events/:id
 */
export async function getEvent(id) {
  await delay()
  const event = MOCK_EVENTS.find(e => e.id === Number(id))
  if (!event) throw new Error('Evento no encontrado')
  return event
  // return (await api.get(`/events/${id}`)).data
}

/**
 * Crea un nuevo evento (solo admin)
 * @param {object} eventData - Datos del evento
 * Backend real: POST /api/events
 */
export async function createEvent(eventData) {
  await delay(500)
  const newEvent = { ...eventData, id: Date.now(), status: 'draft' }
  MOCK_EVENTS.push(newEvent)
  return newEvent
  // return (await api.post('/events', eventData)).data
}

/**
 * Actualiza un evento existente (solo admin)
 * @param {number} id - ID del evento a actualizar
 * @param {object} eventData - Datos actualizados
 * Backend real: PUT /api/events/:id
 */
export async function updateEvent(id, eventData) {
  await delay(500)
  const index = MOCK_EVENTS.findIndex(e => e.id === Number(id))
  if (index === -1) throw new Error('Evento no encontrado')
  MOCK_EVENTS[index] = { ...MOCK_EVENTS[index], ...eventData }
  return MOCK_EVENTS[index]
  // return (await api.put(`/events/${id}`, eventData)).data
}

/**
 * Elimina un evento (solo admin)
 * @param {number} id - ID del evento
 * Backend real: DELETE /api/events/:id
 */
export async function deleteEvent(id) {
  await delay(300)
  const index = MOCK_EVENTS.findIndex(e => e.id === Number(id))
  if (index !== -1) MOCK_EVENTS.splice(index, 1)
  return { success: true }
  // return (await api.delete(`/events/${id}`)).data
}


// --- Tickets / Compra ---

/**
 * Procesa la compra de una entrada
 * @param {object} purchaseData - { event_id, ticket_type_id, quantity, buyer_name, buyer_email, buyer_dni }
 * Backend real: POST /api/tickets/purchase
 */
export async function purchaseTicket(purchaseData) {
  await delay(1000) // Simulamos el tiempo de proceso de pago
  // Generamos un código QR único (en el backend real, esto lo hace el servidor)
  const qrCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  return {
    success: true,
    ticket: {
      id: Date.now(),
      qr_code: qrCode,
      buyer_name: purchaseData.buyer_name,
      buyer_email: purchaseData.buyer_email,
      event_title: purchaseData.event_title,
      event_date: purchaseData.event_date,
      ticket_type: purchaseData.ticket_type_name,
      quantity: purchaseData.quantity,
      total_paid: purchaseData.total,
    }
  }
  // return (await api.post('/tickets/purchase', purchaseData)).data
}

/**
 * Trae todos los tickets vendidos (solo admin)
 * Backend real: GET /api/tickets
 */
export async function getAllTickets() {
  await delay()
  // Generamos tickets mock
  return [
    { id: 1, buyer_name: 'María González', buyer_email: 'mgonzalez@email.com', event_title: 'La Casa de Bernarda Alba', ticket_type: 'Platea', quantity: 2, total_paid: 9000, status: 'paid', purchase_date: '2025-05-20T14:32:00', qr_code: 'TKT-2025-00847-A' },
    { id: 2, buyer_name: 'Carlos Ruiz', buyer_email: 'cruiz@email.com', event_title: 'Orquesta Filarmónica', ticket_type: 'Preferencial', quantity: 1, total_paid: 3500, status: 'used', purchase_date: '2025-05-21T09:15:00', qr_code: 'TKT-2025-00848-B' },
    { id: 3, buyer_name: 'Ana Martínez', buyer_email: 'ana@email.com', event_title: 'Festival de Jazz', ticket_type: 'Abono 3 días', quantity: 3, total_paid: 24000, status: 'paid', purchase_date: '2025-05-22T18:00:00', qr_code: 'TKT-2025-00849-C' },
    { id: 4, buyer_name: 'Luis Pérez', buyer_email: 'lperez@email.com', event_title: 'Gala Empresarial', ticket_type: 'Individual', quantity: 1, total_paid: 12000, status: 'paid', purchase_date: '2025-05-23T11:20:00', qr_code: 'TKT-2025-00850-D' },
  ]
  // return (await api.get('/tickets')).data
}

/**
 * Valida un ticket por QR (para el validador en la puerta)
 * @param {string} qrCode - Código QR escaneado
 * Backend real: POST /api/tickets/validate
 */
export async function validateTicket(qrCode) {
  await delay(500)
  // Simulamos: el primer QR es válido, el segundo ya fue usado, el resto inválido
  if (qrCode === 'TKT-2025-00847-A') return { valid: true, ticket: { buyer_name: 'María González', event_title: 'La Casa de Bernarda Alba', ticket_type: 'Platea' } }
  if (qrCode === 'TKT-2025-00848-B') return { valid: false, reason: 'Entrada ya utilizada' }
  return { valid: false, reason: 'Código QR no encontrado' }
  // return (await api.post('/tickets/validate', { qr_code: qrCode })).data
}


// --- Auth ---

/**
 * Login del administrador
 * @param {string} email
 * @param {string} password
 * Backend real: POST /api/auth/login
 */
export async function login(email, password) {
  await delay(500)
  // Credenciales mock (solo en desarrollo)
  if (email === 'admin@ticketera.com' && password === 'Admin1234!') {
    const token = 'mock-jwt-token-' + Date.now()
    return { token, user: { id: 1, email, role: 'admin', name: 'Administrador' } }
  }
  throw new Error('Email o contraseña incorrectos')
  // return (await api.post('/auth/login', { email, password })).data
}


// --- Dashboard ---

/**
 * Estadísticas del dashboard admin
 * Backend real: GET /api/dashboard/stats
 */
export async function getDashboardStats() {
  await delay()
  return MOCK_STATS
  // return (await api.get('/dashboard/stats')).data
}
