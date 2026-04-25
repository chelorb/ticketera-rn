// src/context/AuthContext.jsx
// Context API de React: permite compartir el estado de sesión
// en CUALQUIER componente de la app sin pasar props manualmente.
//
// Patrón: creamos un Context + un Provider + un hook personalizado.
// El Provider envuelve toda la app (en App.jsx).
// Cualquier componente puede llamar useAuth() para acceder a la sesión.

import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../api'

// 1. Crear el contexto (el "canal" por donde fluye la info)
const AuthContext = createContext(null)

// 2. El Provider: componente que envuelve la app y provee el estado
export function AuthProvider({ children }) {
  // Estado del usuario logueado. null = no hay sesión.
  const [user, setUser] = useState(null)
  // Estado de carga inicial (mientras verificamos si hay sesión guardada)
  const [loading, setLoading] = useState(true)

  // Al montar el componente, verificamos si hay una sesión guardada en localStorage.
  // Esto permite que el admin siga logueado aunque recargue la página.
  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  /**
   * Función de login: llama a la API, guarda el token y el usuario en localStorage.
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    // Guardamos el token JWT en localStorage (persiste entre recargas)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  /**
   * Función de logout: limpia localStorage y resetea el estado.
   */
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // isAdmin: true si hay usuario logueado con rol admin
  const isAdmin = user?.role === 'admin'

  // El value es lo que estará disponible para todos los componentes hijos
  const value = { user, login, logout, isAdmin, loading }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Hook personalizado: forma limpia de consumir el contexto
// En lugar de escribir useContext(AuthContext) en cada componente,
// simplemente llamamos useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
