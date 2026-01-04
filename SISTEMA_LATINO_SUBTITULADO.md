# Sistema de Anime Latino y Subtitulado

## ✅ Cambios Implementados

### 1. **Base de Datos**
- ✅ Agregada columna `audio_type` a la tabla `anime`
- ✅ Valores permitidos: 'LATINO', 'SUBTITULADO'
- ✅ Todos los animes existentes marcados como 'SUBTITULADO' por defecto

### 2. **Backend - Scraper**

#### Configuración Multi-Sitio
```javascript
SITE_CONFIGS = {
  SUBTITULADO: {
    name: 'AnimeFlv',
    baseUrl: 'https://www3.animeflv.net',
    browseUrl: 'https://www3.animeflv.net/browse'
  },
  LATINO: {
    name: 'AnimeOnlineNinja',
    baseUrl: 'https://ww3.animeonline.ninja',
    browseUrl: 'https://ww3.animeonline.ninja/genero/audio-latino'
  }
}
```

#### Scripts de Scraping
- ✅ `npm run scrape:subtitulado` - Scrapea anime subtitulado (AnimeFlv)
- ✅ `npm run scrape:latino` - Scrapea anime latino (AnimeOnlineNinja)

### 3. **Backend - API**

#### Endpoint Actualizado
```
GET /api/anime?audioType=LATINO
GET /api/anime?audioType=SUBTITULADO
```

**AnimeController.js**
- Filtro por `audioType` en query params

**AnimeModel.js**
- `getAll(limit, offset, audioType)` - Filtra por tipo de audio

### 4. **Frontend**

#### UI ya existente
- ✅ Navbar con dropdown para Anime (Latino/Subtitulado)
- ✅ Indicador visual del tipo seleccionado

#### AnimeList Component
```jsx
// Convierte animeType a formato de BD
const audioType = animeType === 'latino' ? 'LATINO' : 'SUBTITULADO'
const url = `http://localhost:5000/api/anime?limit=100&audioType=${audioType}`
```

## 🚀 Uso

### Scraping

```bash
cd backend

# Scrapear anime subtitulado
npm run scrape:subtitulado

# Scrapear anime latino
npm run scrape:latino
```

### Ejecutar la Aplicación

```bash
# Desde la raíz del proyecto
./start-all.sh

# O manualmente:
cd backend && npm start
cd frontend && npm run dev
```

### Ver en el Frontend

1. Abre http://localhost:5173
2. Click en "Anime" en el navbar
3. Selecciona "Latino" o "Subtitulado"
4. Los animes se filtrarán automáticamente

## 📊 Verificar Datos

```bash
cd backend

# Ver animes por tipo
node -e "const pg = require('postgres'); const sql = pg({host:'localhost',database:'animescraping',username:'postgres',password:'postgres'}); (async()=>{const a = await sql\`SELECT audio_type, COUNT(*) FROM anime GROUP BY audio_type\`; console.log(a); await sql.end();})();"
```

## ⚠️ Nota sobre AnimeonlineNinja

El sitio https://ww3.animeonline.ninja/genero/audio-latino/ tiene protección anti-scraping (error 403).

**Opciones:**
1. Usar un navegador automatizado (Puppeteer/Playwright)
2. Configurar proxy/VPN
3. Usar otra fuente para anime latino
4. Por ahora, marcar manualmente animes como LATINO en la BD

## 📝 Estructura de Archivos

```
backend/
├── scrapers/
│   ├── advancedAnimeFlvScraper.js  (Multi-sitio)
│   ├── scrapeLatino.js             (Script latino)
│   ├── scrapeSubtitulado.js        (Script subtitulado)
│   └── inspectLatino.js            (Debug)
├── controllers/
│   └── AnimeController.js          (Filtro audioType)
├── models/
│   └── AnimeModel.js               (Query audioType)
└── db/
    ├── init.sql                    (Schema base)
    └── add_audio_type.sql          (Migración)

frontend/
├── src/
│   ├── App.jsx                     (Selector Latino/Sub)
│   └── components/
│       └── AnimeList.jsx           (API call con audioType)
```

## 🔄 Flujo de Datos

```
1. Usuario selecciona "Latino" o "Subtitulado" en UI
   ↓
2. Frontend envía: GET /api/anime?audioType=LATINO
   ↓
3. Backend filtra: WHERE audio_type = 'LATINO'
   ↓
4. Frontend muestra solo animes del tipo seleccionado
```
