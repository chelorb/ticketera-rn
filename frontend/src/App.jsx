// src/App.jsx
// Componente raíz de la aplicación.
// Define todas las rutas usando React Router v6 y envuelve todo
// con los Providers de contexto (Auth y Cart).

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'

// Páginas públicas
import Home        from './pages/Home'
import EventDetail from './pages/EventDetail'
import Checkout    from './pages/Checkout'
import Success     from './pages/Success'
import Login       from './pages/Login'

// Páginas de admin (protegidas)
import Dashboard   from './pages/admin/Dashboard'
import EventForm   from './pages/admin/EventForm'
import TicketList  from './pages/admin/TicketList'

export default function App() {
  return (
    /*
      BrowserRouter: habilita el enrutamiento basado en la URL del navegador.
      AuthProvider: provee el estado de sesión a toda la app.
      CartProvider: provee el estado del carrito a toda la app.
      El orden importa: AuthProvider va primero porque algunos componentes
      de Cart podrían necesitar saber si hay sesión.
    */
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
          <Routes>

            {/* ── Rutas públicas ── */}
            <Route path="/"                  element={<Home />} />
            <Route path="/eventos/:id"       element={<EventDetail />} />
            <Route path="/checkout"          element={<Checkout />} />
            <Route path="/confirmacion"      element={<Success />} />
            <Route path="/login"             element={<Login />} />

            {/* ── Rutas del admin (protegidas con JWT) ── */}
            {/*
              ProtectedRoute verifica que haya sesión activa.
              Si no hay sesión, redirige automáticamente a /login.
            */}
            <Route path="/admin" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/admin/eventos/nuevo" element={
              <ProtectedRoute><EventForm /></ProtectedRoute>
            } />
            <Route path="/admin/eventos/:id/editar" element={
              <ProtectedRoute><EventForm /></ProtectedRoute>
            } />
            <Route path="/admin/entradas" element={
              <ProtectedRoute><TicketList /></ProtectedRoute>
            } />
            {/* El validador QR está dentro de TicketList (como tab) */}
            <Route path="/admin/validador" element={
              <ProtectedRoute><TicketList /></ProtectedRoute>
            } />

            {/* ── Ruta 404 ── */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center text-center px-4">
                <div>
                  <p className="text-6xl mb-4">🎫</p>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
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
