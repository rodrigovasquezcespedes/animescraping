require('dotenv').config();
const express = require('express');
const cors = require('cors');

const animeRoutes = require('./routes/animeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const origins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()).filter(Boolean)
  : [];
app.use(cors({
  origin: origins,
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/anime', animeRoutes);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en http://0.0.0.0:${PORT}`);
});
