require('dotenv').config();
const express = require('express');
const cors = require('cors');

const animeRoutes = require('./routes/animeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.WEBOS_URL],
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/anime', animeRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 GET /api/anime - Lista de animes`);
  console.log(`📺 GET /api/anime/:id - Anime por ID`);
});
