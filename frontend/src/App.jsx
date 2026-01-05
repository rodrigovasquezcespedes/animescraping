import { useState, useEffect, useRef } from 'react'
import AnimeList from './components/AnimeList'
import Favorites from './components/Favorites'
import './App.css'

function App() {
  const [category, setCategory] = useState('anime')
  const [showFavorites, setShowFavorites] = useState(false)
  const [doramaGenres, setDoramaGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Cargar géneros de doramas al iniciar
    fetchDoramaGenres()
  }, [])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchDoramaGenres = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/anime/genres/doramas')
      if (response.ok) {
        const result = await response.json()
        setDoramaGenres(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching dorama genres:', err)
    }
  }

  const handleDoramaClick = () => {
    setCategory('dorama')
    setSelectedGenre('')
    setShowFavorites(false)
    setDropdownOpen(false)
  }

  const handleGenreClick = (genre) => {
    setCategory('dorama')
    setSelectedGenre(genre)
    setShowFavorites(false)
    setDropdownOpen(false)
  }

  const handleOtherMenuClick = (cat) => {
    setCategory(cat)
    setSelectedGenre('')
    setShowFavorites(false)
    setDropdownOpen(false)
  }

  const toggleDropdown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDropdownOpen(!dropdownOpen)
  }

  return (
    <div className="app">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom">
        <div className="container-fluid px-4">
          <a className="navbar-brand fw-bold fs-5" href="#" style={{ background: 'linear-gradient(135deg, #e9f0c9 0%, #3b657a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            CinoTV
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a 
                  className={`nav-link ${category === 'anime' && !showFavorites ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleOtherMenuClick('anime') }}
                >
                  Anime
                </a>
              </li>
              
              {/* Dorama como dropdown con géneros como submenú */}
              <li className={`nav-item dropdown ${dropdownOpen ? 'show' : ''}`} ref={dropdownRef}>
                <a 
                  className={`nav-link dropdown-toggle ${category === 'dorama' && !showFavorites ? 'active' : ''}`}
                  href="#"
                  role="button"
                  aria-expanded={dropdownOpen}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDoramaClick();
                    setDropdownOpen(!dropdownOpen);
                  }}
                >
                  Dorama
                </a>
                <ul className={`dropdown-menu dropdown-menu-dark ${dropdownOpen ? 'show' : ''}`}>
                  {doramaGenres.map(genre => (
                    <li key={genre}>
                      <a 
                        className={`dropdown-item ${selectedGenre === genre ? 'active' : ''}`}
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleGenreClick(genre); setDropdownOpen(true); }}
                      >
                        🎭 {genre}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Series */}
              <li className="nav-item">
                <a 
                  className={`nav-link ${category === 'serie' && !showFavorites ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleOtherMenuClick('serie') }}
                >
                  Series
                </a>
              </li>

              {/* Películas */}
              <li className="nav-item">
                <a 
                  className={`nav-link ${category === 'pelicula' && !showFavorites ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleOtherMenuClick('pelicula') }}
                >
                  Películas
                </a>
              </li>

              <li className="nav-item">
                <a 
                  className={`nav-link ${showFavorites ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); setShowFavorites(true); setCategory(''); setDropdownOpen(false) }}
                >
                  Favoritos
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main>
        {showFavorites ? <Favorites /> : <AnimeList category={category} genre={selectedGenre} />}
      </main>
    </div>
  )
}

export default App
