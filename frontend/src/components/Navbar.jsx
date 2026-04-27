// src/components/Navbar.jsx
// Navbar público — sin ningún link al panel admin.
// El acceso al admin y al portal de organizadores es solo por URL directa.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { hasItems } = useCart()
  const { isDark, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

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

        <div className="flex items-center gap-2">
          {/* Botón modo oscuro/claro */}
          <button onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo oscuro'}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Carrito — desktop */}
          {hasItems && (
            <Link to="/checkout"
              className="hidden md:flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 font-medium">
              <span>🛒</span><span>Ver compra</span>
            </Link>
          )}

          {/* Hamburguesa mobile */}
          {hasItems && (
            <button onClick={() => setMenuOpen(p => !p)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>

      {/* Menú mobile — solo si hay carrito */}
      {menuOpen && hasItems && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
          <Link to="/checkout" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 text-sm text-brand-600 dark:text-brand-400 font-medium">
            🛒 Ver compra
          </Link>
        </div>
      )}
    </nav>
  )
}
