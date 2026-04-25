// src/components/ProtectedRoute.jsx
// Componente que protege rutas del panel admin.
// Si el usuario NO está logueado como admin, lo redirige al login.
// Se usa envolviendo las rutas en App.jsx.

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAdmin, loading } = useAuth()

  // Mientras verificamos la sesión guardada, no mostramos nada
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando sesión...</div>
      </div>
    )
  }

  // Si no es admin, redirige al login
  if (!isAdmin) {
    return <Navigate to="/login" replace />
  }

  // Si es admin, muestra el contenido protegido
  return children
}
