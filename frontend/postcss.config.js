// postcss.config.js
// PostCSS procesa el CSS antes de entregarlo al navegador.
// Tailwind y Autoprefixer se ejecutan como plugins de PostCSS.

export default {
  plugins: {
    tailwindcss: {},    // Genera las clases de Tailwind
    autoprefixer: {},   // Agrega prefijos CSS para compatibilidad entre navegadores (-webkit-, etc.)
  },
}
