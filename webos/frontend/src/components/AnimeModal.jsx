import { useState, useEffect } from 'react'
import '../styles/AnimeModal.css'

export default function AnimeModal({ anime, onClose }) {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (anime) {
      fetchEpisodes()
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [anime])

  const fetchEpisodes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/anime/${anime.id}`)
      const data = await response.json()
      setEpisodes(data.data?.episodes || [])
    } catch (error) {
      console.error('Error fetching episodes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">×</button>
        <div className="modal-body">
          <div className="modal-image-section">
            <img src={anime.image_url} alt={anime.title} className="modal-image" />
            <div className="modal-info-badges">
              {anime.rating && (
                <span className="modal-rating-badge">� {anime.rating}/10</span>
              )}
            </div>
          </div>
          <div className="modal-title-description-group">
            <h2 className="modal-title">{anime.title}</h2>
            {anime.description && (
              <div className="modal-description-inline">{anime.description}</div>
            )}
            <div className="modal-episodes-section" style={{marginTop: '0.05rem'}}>
              <h3>Capítulos {anime.episodes_count ? `(${anime.episodes_count})` : ''}</h3>
              {loading ? (
                <p className="modal-loading">Cargando capítulos...</p>
              ) : episodes.length > 0 ? (
                <div className="modal-episodes-box">
                  <div className="modal-episodes-scroll">
                    <div className="modal-episodes-grid">
                      {episodes.map((episode) => (
                        <button
                          key={episode.id}
                          className="episode-button"
                          onClick={() => window.open(episode.url, '_blank')}
                        >
                          <span className="episode-number">Cap. {episode.episode_number}</span>
                          {episode.title && <span className="episode-title">{episode.title}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="no-episodes">No hay capítulos disponibles.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
