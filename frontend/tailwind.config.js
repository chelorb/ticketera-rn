// tailwind.config.js
// Le dice a Tailwind en qué archivos buscar clases CSS para incluirlas en el build.
// Solo se incluyen las clases que realmente usamos (tree-shaking automático).

export default {
  // 'class' significa que el modo oscuro se activa agregando la clase "dark" al <html>
  // (en vez de depender solo de la preferencia del sistema operativo)
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}', // Todos los archivos JS/JSX de la carpeta src
  ],
  theme: {
    extend: {
      // Colores personalizados de la marca
      colors: {
        brand: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          500: '#1D9E75', // Color principal
          700: '#0F6E56', // Color oscuro (headers, hover)
          900: '#085041',
        },
      },
      // Fuente personalizada (se carga desde Google Fonts en index.html)
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
