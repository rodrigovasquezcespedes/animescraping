/**
 * Configuración de sitios de scraping
 * Cambia estas URLs según el sitio que quieras usar
 */

module.exports = {
  // Anime Subtitulado (funciona)
  SUBTITULADO: {
    name: 'AnimeFlv',
    baseUrl: 'https://www3.animeflv.net',
    browseUrl: 'https://www3.animeflv.net/browse',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    selectors: {
      animeCard: 'article.Anime',
      title: 'h3.Title',
      link: '> a',
      image: 'img',
      genres: 'a[href*="/browse?genre="]'
    }
  },

  // Anime Latino - Cambiar aquí la URL del sitio
  LATINO: {
    name: 'AnimeLatinoHD',
    
    baseUrl: 'https://www.animelatinohd.com',
    browseUrl: 'https://www.animelatinohd.com/anime',
    
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    },
    
    // Selectores CSS - ajustar según el sitio
    selectors: {
      animeCard: 'article, .anime-card, div.item, li.anime',
      title: 'h3, h2, .title, a.title',
      link: 'a',
      image: 'img',
      genres: 'a[href*="/genero/"], a[href*="/genre/"]'
    }
  }
};
