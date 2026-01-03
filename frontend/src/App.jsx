import AnimeList from './components/AnimeList'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎌 AnimeScape</h1>
        <p>Streaming de Anime</p>
      </header>
      <main>
        <AnimeList />
      </main>
    </div>
  )
}

export default App
