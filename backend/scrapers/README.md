# 🕷️ Scraper de AnimeFlv

Sistema completo de scraping para obtener datos de animes desde animeflv.net e insertarlos en la base de datos PostgreSQL.

## 📋 Características

- ✅ Scraping de todas las páginas de animeflv.net
- ✅ Extracción de información detallada de cada anime
- ✅ Soporte para múltiples géneros por anime
- ✅ Extracción de episodios
- ✅ Manejo de errores y reintentos
- ✅ Evita duplicados automáticamente
- ✅ Respeta delays entre requests
- ✅ Estadísticas detalladas al finalizar

## 🚀 Instalación

```bash
# Instalar dependencias
npm install
```

## 📁 Archivos de Scraping

```
backend/
├── scrapers/
│   ├── scraper.js                    # CLI controlador
│   ├── animeFlvScraper.js           # Scraper básico
│   ├── advancedAnimeFlvScraper.js   # Scraper avanzado con detalles
│   └── scrapingUtils.js             # Utilidades compartidas
```

## 💻 Uso

### Scraping Completo (Recomendado)

Extrae TODOS los animes de todas las páginas con información detallada:

```bash
npm run scrape:advanced
```

O:

```bash
node scrapers/scraper.js scrape --advanced
```

### Scraping Básico (Rápido)

Extrae animes de todas las páginas sin detalles completos:

```bash
npm run scrape
```

### Scraping de Página Específica

Para scraping de una página particular:

```bash
npm run scrape:page 5
```

O:

```bash
node scrapers/scraper.js scrape --page 5
```

### Scraping de Prueba

Solo la primera página (útil para probar):

```bash
npm run scrape:test
```

O:

```bash
node scrapers/scraper.js scrape --test
```

## ⚙️ Configuración

Asegúrate de tener las variables de entorno correctas en `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=animescraping
DB_USER=postgres
DB_PASSWORD=tu_contraseña
PORT=5000
```

## 📊 Información Extraída

Por cada anime se obtiene:

- **Información Básica**
  - Título
  - Imagen/Portada
  - Descripción
  - Rating/Calificación
  - Estado (En emisión / Finalizado)

- **Géneros**
  - Múltiples géneros por anime
  - Relación muchos-a-muchos en BD

- **Episodios**
  - Número de episodio
  - Título del episodio
  - URL del episodio

## 📈 Estadísticas

Al finalizar, el scraper mostrará:

```
✨ ============================================
✨         SCRAPING COMPLETADO
✨ ============================================
📊 Páginas procesadas: 50
🎬 Total animes guardados: 1250
🏷️  Total géneros: 28
📺 Total episodios: 15420
⚠️  Duplicados: 5
❌ Errores: 2
✨ ============================================
```

## ⏱️ Tiempos Estimados

- **Scraping Básico**: ~30-45 minutos (según velocidad de internet)
- **Scraping Avanzado**: ~2-3 horas (incluye detalles de cada anime)
- **Una sola página**: ~1-2 minutos

## 🔄 Delays

El scraper incluye delays automáticos para:
- No sobrecargar el servidor de animeflv
- Evitar bloqueos por IP
- Respetar el términos de servicio

```
- Entre requests: 800ms
- Entre páginas: 1600ms
```

## 🐛 Manejo de Errores

El scraper maneja automáticamente:

- ✅ Conexiones rechazadas
- ✅ Timeouts
- ✅ Páginas no encontradas
- ✅ Acceso denegado (429 rate limit)
- ✅ Errores de inserción en BD
- ✅ Datos incompletos

## 💾 Base de Datos

Las tablas que se utilizan:

```sql
-- Catálogos
anime_status        -- Estados: EN_EMISION, FINALIZADO
genre               -- Géneros de anime

-- Principales
anime               -- Información del anime
anime_genre         -- Relación anime-género
episode             -- Episodios de anime
```

## 🛠️ Estructura de Datos

### Tabla: anime
```
id (serial)
title (varchar 255)
description (text)
image_url (varchar 500)
rating (decimal 3,1)
episodes_count (int)
status_id (foreign key)
created_at (timestamp)
updated_at (timestamp)
```

### Tabla: episode
```
id (serial)
anime_id (foreign key)
episode_number (int)
title (varchar 255)
url (varchar 500)
created_at (timestamp)
```

### Tabla: anime_genre
```
anime_id (foreign key)
genre_id (foreign key)
```

## 🔍 Monitoreo

Durante la ejecución verás:

```
🚀 ============================================
🚀 INICIANDO SCRAPING AVANZADO DE ANIMEFLV
🚀 ============================================

📄 Página 1/50
  └─ 25 animes encontrados
  └─ Procesando [1/25] Naruto...       ✅
  └─ Procesando [2/25] One Piece...    ✅
  ...
```

## ⚠️ Advertencias

1. **Términos de Servicio**: Respeta los términos de servicio de animeflv.net
2. **Rate Limiting**: El scraper incluye delays, no modifiques si no es necesario
3. **Legal**: Asegúrate de cumplir con las leyes de copyright locales
4. **Datos**: Estos datos son públicos pero revisa licencias antes de redistribuir

## 🚨 Solución de Problemas

### Error: "ENOTFOUND www3.animeflv.net"
- Verifica tu conexión a internet
- La página podría estar caída

### Error: "ETIMEDOUT"
- Intenta de nuevo más tarde
- Aumenta el delay en el scraper

### Error: "rate limit" (429)
- Aumenta los delays en los scrapers
- Espera antes de intentar de nuevo

### Error de Base de Datos
- Verifica las credenciales en `.env`
- Asegúrate que la BD existe
- Ejecuta `init.sql` para crear tablas

## 📝 Logs

Los logs muestran:
- Progreso por página
- Anime siendo procesado
- Errores encontrados
- Estadísticas finales

## 🎯 Próximos Pasos

Después del scraping:

1. Verifica que los datos estén en la BD
2. Prueba la API: `GET /api/anime`
3. Visualiza en el frontend
4. Configura actualizaciones periódicas si lo necesitas

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de consola
2. Verifica las variables de entorno
3. Asegúrate que PostgreSQL está corriendo
4. Comprueba la conexión a internet
5. Intenta con `scrape:test` primero

---

**Creado**: Enero 2026
**Versión**: 1.0
