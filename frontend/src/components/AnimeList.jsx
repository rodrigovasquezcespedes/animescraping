import { useState, useEffect } from 'react'
import { animeService } from '../services/animeService'
import '../styles/AnimeList.css'

export default function AnimeList() {
  const [animes, setAnimes] = useState([])
  const [favorites, setFavorites] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnimes()
    fetchFavorites()
  }, [])

  const fetchAnimes = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/anime')
      if (!response.ok) throw new Error('Error fetching anime')
      const result = await response.json()
      setAnimes(result.data || result)
      setError(null)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
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

  if (loading) return <div className="loading">Cargando animes...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="anime-list">
      <h2>Animes Disponibles</h2>
      {animes.length === 0 ? (
        <p className="no-anime">No hay animes disponibles</p>
      ) : (
        <div className="anime-grid">
          {animes.map((anime) => (
            <div key={anime.id} className="anime-card">
              {anime.image_url && (
                <img src={anime.image_url} alt={anime.title} className="anime-image" />
              )}
              <div className="anime-info">
                <h3>{anime.title}</h3>
                {anime.rating && <p className="rating">⭐ {anime.rating}/10</p>}
                {anime.episodes_count && <p className="episodes">📺 {anime.episodes_count} episodios</p>}
                {anime.description && (
                  <p className="description">{anime.description.substring(0, 100)}...</p>
                )}
                <button
                  className={`favorite-btn ${favorites.has(anime.id) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(anime.id, e)}
                  title={favorites.has(anime.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {favorites.has(anime.id) ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
