// src/components/Navbar.jsx
// Navbar con:
// - Modo oscuro/claro (botón con ícono de sol/luna)
// - Menú hamburguesa para pantallas pequeñas (mobile)
// - Clases dark: en cada elemento para que responda al tema

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { hasItems } = useCart()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Estado del menú móvil (abierto/cerrado)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="text-xl">🎟️</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            Ticketera<span className="text-brand-500">RN</span>
          </span>
        </Link>

        {/* Derecha */}
        <div className="flex items-center gap-2">

          {/* Botón modo oscuro/claro — siempre visible */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-9 h-9 flex items-center justify-center rounded-lg
                       text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Links desktop (md+) */}
          <div className="hidden md:flex items-center gap-3">
            {hasItems && (
              <Link to="/checkout"
                className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 font-medium">
                <span>🛒</span><span>Ver compra</span>
              </Link>
            )}
            {isAdmin ? (
              <>
                <Link to="/admin" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Panel Admin
                </Link>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500">
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600">
                Admin
              </Link>
            )}
          </div>

          {/* Hamburguesa mobile */}
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg
                       text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Menú"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Menú mobile desplegable */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          {hasItems && (
            <Link to="/checkout" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 py-2.5 text-sm text-brand-600 dark:text-brand-400 font-medium">
              🛒 Ver compra
            </Link>
          )}
          {isAdmin ? (
            <>
              <Link to="/admin" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                🎛️ Panel Admin
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 py-2.5 text-sm text-red-500 w-full text-left">
                🚪 Salir
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 py-2.5 text-sm text-gray-500 dark:text-gray-400">
              🔐 Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
