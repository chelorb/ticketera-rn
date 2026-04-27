// src/pages/Home.jsx
// Página principal pública. Muestra el buscador y el listado de eventos.

import { useState, useEffect } from 'react'
import { getEvents } from '../api'
import EventCard from '../components/EventCard'
import Navbar from '../components/Navbar'

const CATEGORIES = ['Todos', 'Teatro', 'Música', 'Danza', 'Arte', 'Privado']

export default function Home() {
  const [events, setEvents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')

  useEffect(() => {
    getEvents()
      .then(data => {
        console.log("EVENTOS BACK:", data)

        // 🔥 ADAPTAMOS LOS DATOS DEL BACK
        const adaptados = data.map(e => ({
          ...e,
          title: e.name,          // 👈 clave
          location: "Sin ubicación", // 👈 opcional
          category: e.category || "General"
        }))

        setEvents(adaptados)
        setFiltered(adaptados)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = events

    if (activeCategory !== 'Todos') {
      result = result.filter(e => e.category === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()

      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [search, activeCategory, events])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <div className="bg-brand-700 dark:bg-gray-900 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Eventos</h1>
        <p className="text-brand-100 dark:text-gray-400 mb-8 text-sm">
          Eventos desde tu backend 🚀
        </p>

        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl flex items-center px-4 py-2 shadow-sm">
          <span className="text-gray-400 mr-3">🔍</span>

          <input
            type="text"
            placeholder="Buscar eventos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-700 dark:text-gray-200 bg-transparent"
          />

          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-300 hover:text-gray-500 text-lg"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-sm px-4 py-1.5 rounded-full border
                ${activeCategory === cat
                  ? 'bg-brand-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resultados */}
        {loading ? (
          <p className="text-center text-gray-400">Cargando...</p>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filtered.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>No encontramos eventos</p>
          </div>
        )}

      </div>
    </div>
  )
}
