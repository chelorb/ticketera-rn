// src/api/index.js
// Centraliza TODAS las llamadas al backend.
// Modo MOCK activo — cuando el backend esté listo, descomentar las líneas reales.

import axios from 'axios'

// ─── Configuración de Axios ───────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token JWT antes de cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Datos MOCK ───────────────────────────────────────────────────────────────

const MOCK_EVENTS = [
  { id: 1, title: 'La Casa de Bernarda Alba', description: 'Obra cumbre de Federico García Lorca. Una producción de la Compañía Provincial de Teatro.\n\nDuración: 100 minutos sin intervalo. Apto para mayores de 13 años.', date: '2025-06-14T21:00:00', location: 'Teatro Municipal El Círculo, Bariloche', category: 'Teatro', image_emoji: '🎭', image_bg: '#E1F5EE', image_url: '', total_capacity: 200, available_tickets: 124, status: 'published', organizer_id: null, ticket_types: [{ id: 1, name: 'Platea', price: 4500, available: 80 }, { id: 2, name: 'Pullman', price: 3200, available: 30 }, { id: 3, name: 'Paraíso', price: 2000, available: 14 }] },
  { id: 2, title: 'Orquesta Filarmónica de Río Negro', description: 'Temporada 2025. Beethoven, Sinfonía N°7 y Brahms, Concierto para piano N°2.', date: '2025-06-22T19:00:00', location: 'Sala de Conciertos, Viedma', category: 'Música', image_emoji: '🎵', image_bg: '#E6F1FB', image_url: '', total_capacity: 450, available_tickets: 312, status: 'published', organizer_id: null, ticket_types: [{ id: 4, name: 'General', price: 2000, available: 200 }, { id: 5, name: 'Preferencial', price: 3500, available: 112 }] },
  { id: 3, title: 'Ballet Clásico: Giselle', description: 'El Ballet Estable de Río Negro presenta Giselle, uno de los títulos más románticos del repertorio clásico.', date: '2025-06-27T20:30:00', location: 'Centro Cultural, Cipolletti', category: 'Danza', image_emoji: '💃', image_bg: '#FBEAF0', image_url: '', total_capacity: 180, available_tickets: 180, status: 'published', organizer_id: 1, ticket_types: [{ id: 6, name: 'General', price: 6000, available: 120 }, { id: 7, name: 'VIP', price: 9500, available: 60 }] },
  { id: 4, title: 'Gala Empresarial 2025', description: 'Evento privado de gala organizado por la Cámara de Comercio. Dress code: formal.', date: '2025-07-03T22:00:00', location: 'Hotel Patagonia Grand, Neuquén', category: 'Privado', image_emoji: '🎊', image_bg: '#FAEEDA', image_url: '', total_capacity: 120, available_tickets: 31, status: 'published', organizer_id: 1, ticket_types: [{ id: 8, name: 'Individual', price: 12000, available: 31 }] },
  { id: 5, title: 'Festival de Jazz del Comahue', description: 'Tres días de jazz en el corazón de la Patagonia. Músicos locales e internacionales.', date: '2025-07-18T18:00:00', location: 'Anfiteatro Municipal, General Roca', category: 'Música', image_emoji: '🎷', image_bg: '#EAF3DE', image_url: '', total_capacity: 800, available_tickets: 650, status: 'published', organizer_id: null, ticket_types: [{ id: 9, name: 'Abono 3 días', price: 8000, available: 400 }, { id: 10, name: 'Día viernes', price: 3000, available: 100 }] },
  // Eventos pendientes de aprobación (cargados por organizadores)
  { id: 6, title: 'Tango en la Patagonia', description: 'Una noche de tango con los mejores bailarines de la región. Show + cena incluida.', date: '2025-08-10T21:00:00', location: 'Salón del Club Andino, Bariloche', category: 'Danza', image_emoji: '🌹', image_bg: '#FBEAF0', image_url: '', total_capacity: 100, available_tickets: 100, status: 'pending', organizer_id: 1, ticket_types: [{ id: 11, name: 'General', price: 8000, available: 70 }, { id: 12, name: 'VIP con cena', price: 15000, available: 30 }] },
  { id: 7, title: 'Recital de Folklore', description: 'Los mejores exponentes del folklore patagónico en un escenario al aire libre.', date: '2025-08-20T19:00:00', location: 'Plaza San Martín, Viedma', category: 'Música', image_emoji: '🪗', image_bg: '#EAF3DE', image_url: '', total_capacity: 500, available_tickets: 500, status: 'pending', organizer_id: 2, ticket_types: [{ id: 13, name: 'Entrada general', price: 3000, available: 500 }] },
  { id: 8, title: 'Obra Rechazada (ejemplo)', description: 'Descripción incompleta.', date: '2025-09-01T20:00:00', location: 'Sin confirmar', category: 'Teatro', image_emoji: '🎭', image_bg: '#E1F5EE', image_url: '', total_capacity: 50, available_tickets: 50, status: 'rejected', rejection_reason: 'La descripción es muy corta y falta confirmar el lugar del evento. Por favor completá la información y volvé a enviar.', organizer_id: 1, ticket_types: [{ id: 14, name: 'General', price: 2000, available: 50 }] },
]

// Organizadores (creados por el admin)
const MOCK_ORGANIZERS = [
  { id: 1, name: 'Teatro Municipal Bariloche', email: 'teatro@bariloche.gob.ar', phone: '+54 294 442-0000', organization: 'Municipalidad de Bariloche', status: 'active', created_at: '2025-05-01T10:00:00' },
  { id: 2, name: 'Cultura Río Negro', email: 'cultura@rionegro.gob.ar', phone: '+54 294 442-1111', organization: 'Gobierno de Río Negro', status: 'active', created_at: '2025-05-10T14:00:00' },
]

const MOCK_STATS = { active_events: 8, tickets_sold: 1247, monthly_revenue: 2430000, pending_validation: 23, pending_approval: 2 }

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// ─── EVENTOS ─────────────────────────────────────────────────────────────────

export async function getEvents() {
  await delay()
  return MOCK_EVENTS.filter(e => e.status === 'published')
  // return (await api.get('/events')).data
}

export async function getAllEvents() {
  await delay()
  return MOCK_EVENTS
  // return (await api.get('/events/all')).data
}

export async function getPendingEvents() {
  await delay()
  return MOCK_EVENTS.filter(e => e.status === 'pending')
  // return (await api.get('/events/pending')).data
}

export async function getEvent(id) {
  await delay()
  const event = MOCK_EVENTS.find(e => e.id === Number(id))
  if (!event) throw new Error('Evento no encontrado')
  return event
  // return (await api.get(`/events/${id}`)).data
}

export async function createEvent(eventData) {
  await delay(500)
  const newEvent = { ...eventData, id: Date.now(), status: eventData.status || 'draft' }
  MOCK_EVENTS.push(newEvent)
  return newEvent
  // return (await api.post('/events', eventData)).data
}

export async function updateEvent(id, eventData) {
  await delay(500)
  const index = MOCK_EVENTS.findIndex(e => e.id === Number(id))
  if (index === -1) throw new Error('Evento no encontrado')
  MOCK_EVENTS[index] = { ...MOCK_EVENTS[index], ...eventData }
  return MOCK_EVENTS[index]
  // return (await api.put(`/events/${id}`, eventData)).data
}

export async function deleteEvent(id) {
  await delay(300)
  const index = MOCK_EVENTS.findIndex(e => e.id === Number(id))
  if (index !== -1) MOCK_EVENTS.splice(index, 1)
  return { success: true }
  // return (await api.delete(`/events/${id}`)).data
}

// Aprobar un evento pendiente (solo admin)
export async function approveEvent(id) {
  await delay(500)
  const index = MOCK_EVENTS.findIndex(e => e.id === Number(id))
  if (index === -1) throw new Error('Evento no encontrado')
  MOCK_EVENTS[index].status = 'published'
  // En producción: el backend envía email al organizador notificando la aprobación
  return MOCK_EVENTS[index]
  // return (await api.post(`/events/${id}/approve`)).data
}

// Rechazar un evento pendiente con un motivo (solo admin)
export async function rejectEvent(id, reason) {
  await delay(500)
  const index = MOCK_EVENTS.findIndex(e => e.id === Number(id))
  if (index === -1) throw new Error('Evento no encontrado')
  MOCK_EVENTS[index].status = 'rejected'
  MOCK_EVENTS[index].rejection_reason = reason
  // En producción: el backend envía email al organizador con el motivo del rechazo
  return MOCK_EVENTS[index]
  // return (await api.post(`/events/${id}/reject`, { reason })).data
}

// ─── ORGANIZADORES ───────────────────────────────────────────────────────────

export async function getOrganizers() {
  await delay()
  return MOCK_ORGANIZERS
  // return (await api.get('/organizers')).data
}

// Crea un organizador y (en producción) le manda el email con sus credenciales
export async function createOrganizer(data) {
  await delay(600)
  const newOrg = { ...data, id: Date.now(), status: 'active', created_at: new Date().toISOString() }
  MOCK_ORGANIZERS.push(newOrg)
  // En producción: el backend genera una contraseña temporal y manda el email
  return { organizer: newOrg, temp_password: 'Temp' + Math.random().toString(36).slice(2, 8) + '!' }
  // return (await api.post('/organizers', data)).data
}

export async function deleteOrganizer(id) {
  await delay(300)
  const index = MOCK_ORGANIZERS.findIndex(o => o.id === Number(id))
  if (index !== -1) MOCK_ORGANIZERS.splice(index, 1)
  return { success: true }
  // return (await api.delete(`/organizers/${id}`)).data
}

// ─── EVENTOS DEL ORGANIZADOR ─────────────────────────────────────────────────

// Trae solo los eventos del organizador logueado
export async function getOrganizerEvents(organizerId) {
  await delay()
  return MOCK_EVENTS.filter(e => e.organizer_id === Number(organizerId))
  // return (await api.get('/organizer/events')).data
}

// El organizador envía un evento para revisión (status: pending)
export async function submitEventForReview(eventData) {
  await delay(600)
  const newEvent = {
    ...eventData,
    id: Date.now(),
    status: 'pending', // siempre empieza como pendiente
    available_tickets: eventData.ticket_types.reduce((sum, tt) => sum + Number(tt.available), 0),
  }
  MOCK_EVENTS.push(newEvent)
  // En producción: el backend envía email al admin avisando del nuevo evento
  return newEvent
  // return (await api.post('/organizer/events', eventData)).data
}

// El organizador edita y reenvía un evento rechazado
export async function resubmitEvent(id, eventData) {
  await delay(600)
  const index = MOCK_EVENTS.findIndex(e => e.id === Number(id))
  if (index === -1) throw new Error('Evento no encontrado')
  MOCK_EVENTS[index] = { ...MOCK_EVENTS[index], ...eventData, status: 'pending', rejection_reason: null }
  return MOCK_EVENTS[index]
  // return (await api.put(`/organizer/events/${id}/resubmit`, eventData)).data
}

// ─── TICKETS ─────────────────────────────────────────────────────────────────

export async function purchaseTicket(purchaseData) {
  await delay(1000)
  const qrCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  return {
    success: true,
    ticket: { id: Date.now(), qr_code: qrCode, buyer_name: purchaseData.buyer_name, buyer_email: purchaseData.buyer_email, event_title: purchaseData.event_title, event_date: purchaseData.event_date, ticket_type: purchaseData.ticket_type_name, quantity: purchaseData.quantity, total_paid: purchaseData.total }
  }
  // return (await api.post('/tickets/purchase', purchaseData)).data
}

export async function getAllTickets() {
  await delay()
  return [
    { id: 1, buyer_name: 'María González', buyer_email: 'mgonzalez@email.com', event_title: 'La Casa de Bernarda Alba', ticket_type: 'Platea', quantity: 2, total_paid: 9000, status: 'paid', purchase_date: '2025-05-20T14:32:00', qr_code: 'TKT-2025-00847-A' },
    { id: 2, buyer_name: 'Carlos Ruiz', buyer_email: 'cruiz@email.com', event_title: 'Orquesta Filarmónica', ticket_type: 'Preferencial', quantity: 1, total_paid: 3500, status: 'used', purchase_date: '2025-05-21T09:15:00', qr_code: 'TKT-2025-00848-B' },
    { id: 3, buyer_name: 'Ana Martínez', buyer_email: 'ana@email.com', event_title: 'Festival de Jazz', ticket_type: 'Abono 3 días', quantity: 3, total_paid: 24000, status: 'paid', purchase_date: '2025-05-22T18:00:00', qr_code: 'TKT-2025-00849-C' },
  ]
  // return (await api.get('/tickets')).data
}

export async function validateTicket(qrCode) {
  await delay(500)
  if (qrCode === 'TKT-2025-00847-A') return { valid: true, ticket: { buyer_name: 'María González', event_title: 'La Casa de Bernarda Alba', ticket_type: 'Platea' } }
  if (qrCode === 'TKT-2025-00848-B') return { valid: false, reason: 'Entrada ya utilizada' }
  return { valid: false, reason: 'Código QR no encontrado' }
  // return (await api.post('/tickets/validate', { qr_code: qrCode })).data
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  await delay(500)
  if (email === 'admin@ticketera.com' && password === 'Admin1234!') {
    return { token: 'mock-admin-token', user: { id: 0, email, role: 'admin', name: 'Administrador' } }
  }
  // Credenciales de organizadores mock
  const org = MOCK_ORGANIZERS.find(o => o.email === email)
  if (org && password === 'Organizer1234!') {
    return { token: 'mock-org-token-' + org.id, user: { id: org.id, email, role: 'organizer', name: org.name, organization: org.organization } }
  }
  throw new Error('Email o contraseña incorrectos')
  // return (await api.post('/auth/login', { email, password })).data
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  await delay()
  return MOCK_STATS
  // return (await api.get('/dashboard/stats')).data
}
