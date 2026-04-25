// src/components/Navbar.jsx
// Barra de navegación superior que aparece en todas las páginas públicas.
// Muestra el logo, link al admin si hay sesión, y el carrito si tiene items.

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { hasItems } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🎟️</span>
          <span className="font-semibold text-gray-900">
            Ticketera<span className="text-brand-500">RN</span>
          </span>
        </Link>

        {/* Links de la derecha */}
        <div className="flex items-center gap-3">

          {/* Indicador de carrito */}
          {hasItems && (
            <Link
              to="/checkout"
              className="flex items-center gap-1.5 text-sm text-brand-700 font-medium"
            >
              <span>🛒</span>
              <span>Ver compra</span>
            </Link>
          )}

          {/* Si hay sesión de admin */}
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Panel Admin
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Salir
              </button>
            </>
          ) : (
            /* Si no hay sesión, link discreto al login */
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
