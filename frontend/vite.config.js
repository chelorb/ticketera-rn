// vite.config.js
// Vite es el "bundler" que compila y sirve nuestra app React en desarrollo.
// También hace el build final optimizado para producción.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173, // Puerto donde corre el frontend en desarrollo
    proxy: {
      // Proxy: cuando el frontend llama a /api/...,
      // Vite redirige esa llamada al backend en el puerto 3001.
      // Así evitamos errores de CORS en desarrollo.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
