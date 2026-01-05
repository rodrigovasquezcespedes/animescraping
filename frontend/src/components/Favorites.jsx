import { useState, useEffect } from 'react'
import { animeService } from '../services/animeService'
import '../styles/AnimeList.css'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const result = await animeService.getFavorites()
      setFavorites(result.data || result || [])
      setError(null)
    } catch (err) {
      console.error('Error:', err)
      setError('Error cargando favoritos')
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (animeId, e) => {
    e.stopPropagation()
    try {
      await animeService.removeFavorite(animeId)
      setFavorites(prev => prev.filter(anime => anime.id !== animeId))
    } catch (err) {
      console.error('Error removing favorite:', err)
    }
  }

  if (loading) return <div className="loading">Cargando favoritos...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="anime-list">
      {favorites.length === 0 ? (
        <div className="no-anime">No hay favoritos</div>
      ) : (
        <div className="anime-grid">
          {favorites.map((anime) => (
            <div key={anime.id} className="anime-card">
              <div className="anime-image-container">
                {anime.image_url && (
                  <img src={anime.image_url} alt={anime.title} className="anime-image" />
                )}
                <button
                  className="favorite-btn active"
                  onClick={(e) => removeFavorite(anime.id, e)}
                  title="Quitar de favoritos"
                >
                  ❤️
                </button>
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
    </div>
  )
}
