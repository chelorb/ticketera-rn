// src/context/CartContext.jsx
// Maneja el estado del carrito de compras.
// Por ahora es simple: un evento + tipo de entrada + cantidad.
// (En el futuro se puede extender para múltiples items)

import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  // El carrito guarda: evento seleccionado, tipo de entrada, cantidad
  const [cart, setCart] = useState(null)

  /**
   * Agrega una selección al carrito
   * @param {object} event - El evento completo
   * @param {object} ticketType - El tipo de entrada seleccionado { id, name, price }
   * @param {number} quantity - Cantidad de entradas
   */
  const addToCart = (event, ticketType, quantity) => {
    setCart({
      event,
      ticketType,
      quantity,
      subtotal: ticketType.price * quantity,
      // Cargo por servicio: 5% (simulado)
      serviceFee: Math.round(ticketType.price * quantity * 0.05),
      get total() { return this.subtotal + this.serviceFee },
    })
  }

  /**
   * Vacía el carrito (después de completar la compra)
   */
  const clearCart = () => setCart(null)

  // ¿Hay algo en el carrito?
  const hasItems = cart !== null

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart, hasItems }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider')
  return context
}
