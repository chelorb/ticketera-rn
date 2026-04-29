// src/api/index.js
// Llamadas reales al backend. Los mocks fueron reemplazados.
// El backend corre en http://localhost:3001
// Vite redirige /api → http://localhost:3001 (configurado en vite.config.js)

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

// Si el servidor devuelve 401, limpiamos la sesión automáticamente
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/organizer/login'
    }
    return Promise.reject(error)
  }
)

// Helper para extraer el mensaje de error de la respuesta
function getErrorMessage(err) {
  return err.response?.data?.error || err.message || 'Error desconocido'
}

// ─── EVENTOS PÚBLICOS ─────────────────────────────────────────────────────────

export async function getEvents() {
  const res = await api.get('/events')
  return res.data
}

export async function getEvent(id) {
  const res = await api.get(`/events/${id}`)
  return res.data
}

// ─── EVENTOS ADMIN ────────────────────────────────────────────────────────────

export async function getAllEvents() {
  const res = await api.get('/admin/events')
  return res.data
}

export async function getPendingEvents() {
  const res = await api.get('/admin/events/pending')
  return res.data
}

export async function createEvent(eventData) {
  const res = await api.post('/admin/events', eventData)
  return res.data
}

export async function updateEvent(id, eventData) {
  const res = await api.put(`/admin/events/${id}`, eventData)
  return res.data
}

export async function deleteEvent(id) {
  const res = await api.delete(`/admin/events/${id}`)
  return res.data
}

export async function approveEvent(id) {
  const res = await api.post(`/admin/events/${id}/approve`)
  return res.data
}

export async function rejectEvent(id, reason) {
  const res = await api.post(`/admin/events/${id}/reject`, { reason })
  return res.data
}

// ─── ORGANIZADORES ────────────────────────────────────────────────────────────

export async function getOrganizers() {
  const res = await api.get('/admin/organizers')
  return res.data
}

export async function createOrganizer(data) {
  const res = await api.post('/admin/organizers', data)
  return res.data
}

export async function deleteOrganizer(id) {
  const res = await api.delete(`/admin/organizers/${id}`)
  return res.data
}

// ─── EVENTOS DEL ORGANIZADOR ─────────────────────────────────────────────────

export async function getOrganizerEvents() {
  // El backend identifica al organizador por el token JWT, no necesita ID
  const res = await api.get('/organizer/events')
  return res.data
}

export async function submitEventForReview(eventData) {
  const res = await api.post('/organizer/events', eventData)
  return res.data
}

export async function resubmitEvent(id, eventData) {
  const res = await api.put(`/organizer/events/${id}/resubmit`, eventData)
  return res.data
}

// ─── TICKETS ─────────────────────────────────────────────────────────────────

export async function purchaseTicket(purchaseData) {
  const res = await api.post('/tickets/purchase', purchaseData)
  return res.data
}

export async function getAllTickets() {
  const res = await api.get('/admin/tickets')
  return res.data
}

export async function validateTicket(qrCode) {
  const res = await api.post('/tickets/validate', { qr_code: qrCode })
  return res.data
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export async function changePassword(currentPassword, newPassword) {
  const res = await api.post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  return res.data
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const res = await api.get('/admin/stats')
  return res.data
}
