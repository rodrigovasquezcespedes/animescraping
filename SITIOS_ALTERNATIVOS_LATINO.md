# 🌐 Sitios de Anime Latino Alternativos

## ❌ Sitio Actual (NO funciona)
- **AnimeonlineNinja**: https://ww3.animeonline.ninja/genero/audio-latino/
  - Error: 403 Forbidden (protección anti-scraping)

## ✅ Sitios Alternativos Recomendados

### 1. **AnimeFenix** (Recomendado)
- URL: https://www.animefenix.tv/
- Latino: https://www.animefenix.tv/animes?tipo[]=Latino
- ✅ Popular, bien estructurado
- ✅ API amigable

### 2. **TioAnime**
- URL: https://tioanime.com/
- Latino: https://tioanime.com/directorio?type[]=Latino
- ✅ Muy popular en Latinoamérica
- ✅ Buena calidad

### 3. **MonosChinos**
- URL: https://monoschinos2.com/
- Latino: https://monoschinos2.com/emision?type=latino
- ✅ Muchos animes doblados

### 4. **JKAnime**
- URL: https://jkanime.net/
- Latino: https://jkanime.net/?filtro=latino
- ✅ Amplio catálogo
- ✅ Buena organización

### 5. **AnimeYT**
- URL: https://animeyt.es/
- Latino: https://animeyt.es/genero/latino
- ✅ Interfaz limpia

## 🔧 Cómo Cambiar el Sitio

### Opción 1: Editar siteConfig.js (Recomendado)

```bash
cd backend/scrapers
nano siteConfig.js
```

Cambiar la sección LATINO:

```javascript
LATINO: {
  name: 'AnimeFenix',  // Cambiar nombre
  baseUrl: 'https://www.animefenix.tv',  // Cambiar URL base
  browseUrl: 'https://www.animefenix.tv/animes?tipo[]=Latino',  // Cambiar URL de navegación
  // ... ajustar selectores según el sitio
}
```

### Opción 2: Script de prueba rápida

```bash
# Probar diferentes sitios
node scrapers/testSite.js https://www.animefenix.tv/animes?tipo[]=Latino
```

## 📋 Pasos para Agregar un Sitio Nuevo

1. **Inspeccionar el HTML**
```bash
node scrapers/inspectNewSite.js https://www.animefenix.tv/animes?tipo[]=Latino
```

2. **Identificar selectores CSS**
   - Contenedor de anime: `.anime-card`, `article`, `.item`
   - Título: `h3.title`, `.anime-title`
   - Enlace: `a.anime-link`
   - Imagen: `img.anime-img`

3. **Actualizar siteConfig.js**
```javascript
selectors: {
  animeCard: 'article.anime-card',  // Tu selector
  title: 'h3.title',
  link: 'a',
  image: 'img',
  genres: 'a[href*="/genero/"]'
}
```

4. **Probar**
```bash
npm run scrape:latino
```

## 🎯 Recomendación

Te sugiero probar con **AnimeFenix** o **TioAnime** ya que son los más populares y probablemente más estables para scraping.

¿Cuál sitio prefieres probar primero?
