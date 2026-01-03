import React, { useState, useEffect } from 'react'
import Spotlight from '@enact/spotlight'
import Skinnable from '@enact/ui/Skinnable'
import Panel from '@enact/moonstone/Panel'
import './App.css'

Spotlight.initialize()

const API_URL = 'http://localhost:5000/api'

function App() {
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    fetchAnimes()
  }, [])

  const fetchAnimes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/anime?limit=20`)
      const result = await response.json()
      setAnimes(result.data || result)
    } catch (error) {
      console.error('Error fetching anime:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    const maxIndex = animes.length - 1
    if (e.key === 'ArrowRight') {
      setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : prev))
    } else if (e.key === 'ArrowLeft') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 4 < animes.length ? prev + 4 : Math.min(prev + 4, maxIndex)))
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev >= 4 ? prev - 4 : 0))
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [animes.length])

  return (
    <Panel className="app-panel">
      <div className="app-container">
        <h1>🎌 AnimeScape</h1>
        <p>Streaming de Anime para WebOS</p>

        {loading ? (
          <div className="loading">Cargando animes...</div>
        ) : animes.length === 0 ? (
          <div className="no-anime">No hay animes disponibles</div>
        ) : (
          <div className="anime-grid">
            {animes.map((anime, index) => (
              <div 
                key={anime.id} 
                className={`anime-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                {anime.image_url && (
                  <img src={anime.image_url} alt={anime.title} className="anime-thumbnail" />
                )}
                <div className="anime-details">
                  <h3>{anime.title}</h3>
                  {anime.rating && <p className="rating">⭐ {anime.rating}/10</p>}
                  {anime.episodes && <p className="episodes">📺 {anime.episodes} eps</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

export default Skinnable(App)
