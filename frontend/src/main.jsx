// src/main.jsx
// Este es el punto de entrada de toda la app React.
// Monta el componente raíz <App /> dentro del <div id="root"> del HTML.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Estilos globales + Tailwind

// ReactDOM.createRoot() crea la "raíz" de React en el div#root del HTML
// StrictMode activa advertencias extra en desarrollo (no afecta producción)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
