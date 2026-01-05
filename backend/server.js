require('dotenv').config();
const express = require('express');
const cors = require('cors');

const animeRoutes = require('./routes/animeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    'http://192.168.1.157:5173', // frontend dev en esa IP
    'http://192.168.1.157',      // posible acceso directo desde webOS
    'http://192.168.1.157:3000', // si usas otro puerto
    'http://192.168.1.157:5000', // si accedes directo al backend
    'http://127.0.0.1:5500',     // para pruebas con Live Server
    'http://localhost:5500',     // Live Server en localhost
    'http://192.168.1.157:5500'  // Live Server en IP local
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/anime', animeRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
