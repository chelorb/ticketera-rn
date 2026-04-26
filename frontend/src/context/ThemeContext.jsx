// src/context/ThemeContext.jsx
// Maneja el modo claro/oscuro de toda la app.
//
// Estrategia: Tailwind usa la clase "dark" en el elemento <html>.
// Cuando la agregamos, todas las clases dark:* se activan automáticamente.
// Guardamos la preferencia en localStorage para que persista entre sesiones.
// También respetamos la preferencia del sistema operativo del usuario.

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Al iniciar, verificamos en este orden:
    // 1. ¿Hay preferencia guardada en localStorage?
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    // 2. ¿El sistema operativo del usuario prefiere modo oscuro?
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Cada vez que cambia isDark, actualizamos la clase del <html>
  useEffect(() => {
    const root = document.documentElement // el elemento <html>
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(prev => !prev)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}
