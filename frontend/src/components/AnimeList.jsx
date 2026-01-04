import { useState, useEffect } from 'react'
import { animeService } from '../services/animeService'
import AnimeModal from './AnimeModal'
import '../styles/AnimeList.css'

export default function AnimeList({ category = 'anime', genre = '' }) {
  const [animes, setAnimes] = useState([])
  const [favorites, setFavorites] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAnime, setSelectedAnime] = useState(null)

  useEffect(() => {
    fetchAnimes()
    fetchFavorites()
  }, [category, genre])

  const fetchAnimes = async () => {
    try {
      setLoading(true)
      
      // Mapear categoría del frontend a la del backend
      let categoryParam = 'ANIME'
      if (category === 'dorama') categoryParam = 'DORAMA'
      else if (category === 'serie') categoryParam = 'SERIE'
      else if (category === 'pelicula') categoryParam = 'PELICULA'
      
      let url = `http://localhost:5000/api/anime?limit=1000&category=${categoryParam}`
      
      if (genre) {
        url += `&genre=${encodeURIComponent(genre)}`
      }
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Error fetching anime')
      const result = await response.json()
      
      let filteredAnimes = result.data || result
      
      const categoryNames = { anime: 'animes', dorama: 'doramas', serie: 'series', pelicula: 'películas' }
      
      if (!filteredAnimes || filteredAnimes.length === 0) {
        setError(`Sin ${categoryNames[category] || 'contenido'}${genre ? ` de ${genre}` : ''}. Ejecuta scraping en /backend`)
        setAnimes([])
        setLoading(false)
        return
      }
      
      setAnimes(filteredAnimes)
      setError(null)
    } catch (err) {
      console.error('Error:', err)
      setError('Error conectando con el backend. Verifica que esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const result = await animeService.getFavorites()
      const favIds = new Set((result.data || result).map(a => a.id))
      setFavorites(favIds)
    } catch (err) {
      console.error('Error fetching favorites:', err)
    }
  }

  const toggleFavorite = async (animeId, e) => {
    e.stopPropagation()
    try {
      if (favorites.has(animeId)) {
        await animeService.removeFavorite(animeId)
        setFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(animeId)
          return newSet
        })
      } else {
        await animeService.addFavorite(animeId)
        setFavorites(prev => new Set(prev).add(animeId))
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>
  if (error) return <div className="error">Error: {error}</div>

  const categoryNames = { anime: 'animes', dorama: 'doramas', serie: 'series', pelicula: 'películas' }

  return (
    <div className="anime-list">
      {/* Mostrar título con género si está seleccionado */}
      {category === 'dorama' && genre && (
        <h2 className="genre-title">🎭 Doramas de {genre}</h2>
      )}

      {animes.length === 0 ? (
        <p className="no-anime">No hay {categoryNames[category] || 'contenido'}{genre ? ` de ${genre}` : ''}</p>
      ) : (
        <div className="anime-grid">
          {animes.map((anime) => (
            <div 
              key={anime.id} 
              className="anime-card"
              onClick={() => setSelectedAnime(anime)}
            >
              <div className="anime-image-container">
                {anime.image_url && (
                  <img src={anime.image_url} alt={anime.title} className="anime-image" />
                )}
                <button
                  className={`favorite-btn ${favorites.has(anime.id) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(anime.id, e)}
                  title={favorites.has(anime.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {favorites.has(anime.id) ? '❤️' : '🤍'}
                </button>
                <span className={`audio-badge ${anime.audio_type === 'LATINO' ? 'latino' : 'subtitulado'}`}>
                  {anime.audio_type === 'LATINO' ? 'LAT' : 'SUB'}
                </span>
              </div>
              <div className="anime-info">
                <h3>{anime.title}</h3>
                {anime.rating && <p className="rating">⭐ {anime.rating}/10</p>}
                {anime.episodes_count && <p className="episodes">📺 {anime.episodes_count} episodios</p>}
                {anime.description && (
                  <p className="description">{anime.description.substring(0, 100)}...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedAnime && (
        <AnimeModal 
          anime={selectedAnime} 
          onClose={() => setSelectedAnime(null)} 
        />
      )}
    </div>
  )
}
