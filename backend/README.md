# AnimeScape Backend

Backend minimalista con Node.js, Express y PostgreSQL para servir datos de anime.

## Instalación

```bash
cd backend
npm install
```

## Configuración

1. Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales de PostgreSQL

## Base de datos

Ejecuta el script de inicialización:
```bash
psql -U postgres -d animescraping -f db/init.sql
```

## Ejecutar

```bash
npm run dev    # Modo desarrollo (con nodemon)
npm start      # Modo producción
```

El servidor estará en `http://localhost:5000`

## API Endpoints

- `GET /api/anime` - Obtener todos los animes (con paginación)
  - Query params: `limit`, `offset`
- `GET /api/anime/:id` - Obtener anime por ID

