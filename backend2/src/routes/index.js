// src/routes/index.js
// Define todos los endpoints de la API y qué middleware aplica a cada uno.

const express = require('express')
const router  = express.Router()

const { authenticate, requireAdmin, requireOrganizer } = require('../middleware/authMiddleware')

const authController      = require('../controllers/authController')
const eventController     = require('../controllers/eventController')
const ticketController    = require('../controllers/ticketController')

// ─── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',           authController.login)
router.post('/auth/change-password', authenticate, authController.changePassword)
router.get ('/auth/me',              authenticate, authController.me)

// ─── EVENTOS PÚBLICOS ─────────────────────────────────────────────────────────
router.get('/events',     eventController.getPublicEvents)
router.get('/events/:id', eventController.getPublicEvent)

// ─── COMPRA DE ENTRADAS (pública) ─────────────────────────────────────────────
router.post('/tickets/purchase',  ticketController.purchaseTicket)
router.post('/tickets/validate',  authenticate, ticketController.validateTicket)

// ─── DASHBOARD ADMIN ─────────────────────────────────────────────────────────
router.get('/admin/stats', authenticate, requireAdmin, eventController.getDashboardStats)

// ─── EVENTOS ADMIN ────────────────────────────────────────────────────────────
router.get   ('/admin/events',           authenticate, requireAdmin, eventController.getAllEvents)
router.get   ('/admin/events/pending',   authenticate, requireAdmin, eventController.getPendingEvents)
router.post  ('/admin/events',           authenticate, requireAdmin, eventController.createEvent)
router.put   ('/admin/events/:id',       authenticate, requireAdmin, eventController.updateEvent)
router.delete('/admin/events/:id',       authenticate, requireAdmin, eventController.deleteEvent)
router.post  ('/admin/events/:id/approve', authenticate, requireAdmin, eventController.approveEvent)
router.post  ('/admin/events/:id/reject',  authenticate, requireAdmin, eventController.rejectEvent)

// ─── TICKETS ADMIN ────────────────────────────────────────────────────────────
router.get('/admin/tickets', authenticate, requireAdmin, ticketController.getAllTickets)

// ─── ORGANIZADORES (admin) ────────────────────────────────────────────────────
router.get   ('/admin/organizers',     authenticate, requireAdmin, ticketController.getOrganizers)
router.post  ('/admin/organizers',     authenticate, requireAdmin, ticketController.createOrganizer)
router.delete('/admin/organizers/:id', authenticate, requireAdmin, ticketController.deleteOrganizer)

// ─── PORTAL DE ORGANIZADORES ─────────────────────────────────────────────────
router.get ('/organizer/events',              authenticate, requireOrganizer, eventController.getOrganizerEvents)
router.post('/organizer/events',              authenticate, requireOrganizer, eventController.submitEvent)
router.put ('/organizer/events/:id/resubmit', authenticate, requireOrganizer, eventController.resubmitEvent)

module.exports = router
