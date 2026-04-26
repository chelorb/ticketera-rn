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
      .then(data => { setEvents(data); setFiltered(data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = events
    if (activeCategory !== 'Todos') result = result.filter(e => e.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [search, activeCategory, events])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <div className="bg-brand-700 dark:bg-gray-900 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Eventos en Río Negro</h1>
        <p className="text-brand-100 dark:text-gray-400 mb-8 text-sm">
          Encontrá tu próxima experiencia cultural
        </p>
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl flex items-center px-4 py-2 shadow-sm">
          <span className="text-gray-400 mr-3">🔍</span>
          <input
            type="text"
            placeholder="Buscar eventos, artistas o lugares..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
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
              className={`text-sm px-4 py-1.5 rounded-full whitespace-nowrap border transition-colors
                ${activeCategory === cat
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-100 dark:bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-16" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 mb-4">
              {filtered.length} evento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filtered.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-gray-600 dark:text-gray-400">No encontramos eventos</p>
            <p className="text-sm mt-1">Probá con otra búsqueda o categoría</p>
          </div>
        )}
      </div>
    </div>
  )
}
