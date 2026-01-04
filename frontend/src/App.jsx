import { useState } from 'react'
import AnimeList from './components/AnimeList'
import Favorites from './components/Favorites'
import './App.css'

function App() {
  const [category, setCategory] = useState('anime')
  const [showFavorites, setShowFavorites] = useState(false)

  return (
    <div className="app">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom">
        <div className="container-fluid px-4">
          <a className="navbar-brand fw-bold fs-5" href="#" style={{ background: 'linear-gradient(135deg, #e9f0c9 0%, #3b657a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            AnimeScape
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a 
                  className={`nav-link ${category === 'anime' ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); setCategory('anime'); setShowFavorites(false) }}
                >
                  Anime
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${category === 'dorama' ? 'active' : ''}`}
                  href="#"
                  onClick={() => { setCategory('dorama'); setShowFavorites(false) }}
                >
                  Dorama
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${showFavorites ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); setShowFavorites(true); setCategory('') }}
                >
                  Favoritos
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main>
        {showFavorites ? <Favorites /> : <AnimeList category={category} />}
      </main>
    </div>
  )
}

export default App
