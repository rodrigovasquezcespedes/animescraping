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

3. Inicializa la base de datos:
```bash
psql -U postgres -d animescraping -f db/init.sql
```

## Ejecutar

```bash
npm run dev     # Modo desarrollo
npm start       # Modo producción
```

## Scraping

```bash
# Anime Subtitulado (AnimeFlv)
npm run scrape:subtitulado  # Primera página de prueba

# Anime Latino (AnimeOnlineNinja)
npm run scrape:latino        # Primera página de prueba

# Scraping avanzado (página específica)
npm run scrape:page N        # Página específica
npm run scrape:test          # Test (solo primera página)
```

El servidor estará en `http://localhost:5000`

## API Endpoints

- `GET /api/anime` - Obtener todos los animes
- `GET /api/anime/:id` - Obtener anime por ID
