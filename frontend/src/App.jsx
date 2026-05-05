// src/App.jsx
// Rutas principales. Incluye portal de organizadores y flujo de aprobación.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'

// Páginas públicas
import Home        from './pages/Home'
import Validator    from './pages/Validator'
import EventDetail from './pages/EventDetail'
import Checkout    from './pages/Checkout'
import Success     from './pages/Success'

// Admin
import Dashboard     from './pages/admin/Dashboard'
import EventForm     from './pages/admin/EventForm'
import TicketList    from './pages/admin/TicketList'
import PendingEvents from './pages/admin/PendingEvents'
import Organizers    from './pages/admin/Organizers'

// Organizadores
import OrganizerLogin     from './pages/organizer/OrganizerLogin'
import OrganizerDashboard from './pages/organizer/OrganizerDashboard'
import OrganizerEventForm from './pages/organizer/OrganizerEventForm'
import ChangePassword    from './pages/organizer/ChangePassword'

// ── Guards de ruta ────────────────────────────────────────────────────────────

// Protege rutas del admin — redirige al login del organizador si no es admin
function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Verificando sesión...</div>
  if (!isAdmin) return <Navigate to="/organizer/login" replace />
  return children
}

// Protege rutas del organizador — redirige al login si no está autenticado como organizer
// Si must_change_password=true, redirige a cambio de contraseña obligatorio
function OrganizerRoute({ children }) {
  const { user, isOrganizer, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Verificando sesión...</div>
  if (!isOrganizer) return <Navigate to="/organizer/login" replace />
  // Si es primer ingreso, obligamos a cambiar la contraseña
  if (user?.must_change_password) return <Navigate to="/organizer/change-password" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>

              {/* ── Sitio público ── */}
              <Route path="/"             element={<Home />} />
              <Route path="/eventos/:id"  element={<EventDetail />} />
              <Route path="/checkout"     element={<Checkout />} />
              <Route path="/validador"         element={<Validator />} />
              <Route path="/confirmacion" element={<Success />} />

              {/* ── Portal de organizadores ── */}
              {/* URL separada, no linkeada desde el sitio público */}
              <Route path="/organizer/login" element={<OrganizerLogin />} />
              <Route path="/organizer/change-password" element={<ChangePassword />} />
              <Route path="/organizer/dashboard" element={
                <OrganizerRoute><OrganizerDashboard /></OrganizerRoute>
              } />
              <Route path="/organizer/eventos/nuevo" element={
                <OrganizerRoute><OrganizerEventForm /></OrganizerRoute>
              } />
              <Route path="/organizer/eventos/:id/editar" element={
                <OrganizerRoute><OrganizerEventForm /></OrganizerRoute>
              } />

              {/* ── Panel admin (protegido) ── */}
              {/* El link de Admin ya no aparece en el Navbar público */}
              <Route path="/admin" element={
                <AdminRoute><Dashboard /></AdminRoute>
              } />
              <Route path="/admin/eventos/nuevo" element={
                <AdminRoute><EventForm /></AdminRoute>
              } />
              <Route path="/admin/eventos/:id/editar" element={
                <AdminRoute><EventForm /></AdminRoute>
              } />
              <Route path="/admin/entradas" element={
                <AdminRoute><TicketList /></AdminRoute>
              } />
              <Route path="/admin/validador" element={
                <AdminRoute><TicketList /></AdminRoute>
              } />
              <Route path="/admin/pendientes" element={
                <AdminRoute><PendingEvents /></AdminRoute>
              } />
              <Route path="/admin/organizadores" element={
                <AdminRoute><Organizers /></AdminRoute>
              } />

              {/* ── 404 ── */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-center px-4">
                  <div>
                    <p className="text-6xl mb-4">🎫</p>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Página no encontrada</h1>
                    <p className="text-gray-500 mb-6">La URL que ingresaste no existe.</p>
                    <a href="/" className="btn-primary text-sm">Ir al inicio</a>
                  </div>
                </div>
              } />

            </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
