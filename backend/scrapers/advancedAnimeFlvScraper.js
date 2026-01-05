const axios = require('axios');
const cheerio = require('cheerio');
const postgres = require('postgres');

function getSqlConnection() {
  return postgres({
    host: 'localhost',
    port: 5432,
    database: 'animescraping',
    username: 'postgres',
    password: 'postgres',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  });
}

const BASE_URL = 'https://www3.animeflv.net';
const BROWSE_URL = `${BASE_URL}/browse`;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const DELAY_MS = 800; // milisegundos entre requests

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

class AdvancedAnimeFlvScraper {
  constructor(type = 'SUBTITULADO') {
    // Determinar si es DORAMA o audioType (LATINO/SUBTITULADO)
    this.audioType = type;
    this.category = 'ANIME';
    this.stats = {
      totalPages: 0,
      totalAnimes: 0,
      totalGenres: 0,
      totalEpisodes: 0,
      errors: 0,
      duplicates: 0
    };
    this.allAnimes = new Set();
    // Inicializar siteConfig correctamente
    this.siteConfig = {
      name: 'AnimeFLV',
      baseUrl: BASE_URL,
      browseUrl: BROWSE_URL,
      headers
    };
  }

  /**
   * Obtener total de páginas
   */
  async getTotalPages() {
    try {
      console.log(`📖 Detectando número total de páginas en ${this.siteConfig.name}...`);
      const response = await axios.get(`${this.siteConfig.browseUrl}?page=1`, { 
        headers: this.siteConfig.headers, 
        timeout: 15000 
      });
      const $ = cheerio.load(response.data);
      
      let maxPage = 1;
      const paginationLinks = $('.pagination a, .nav-links a, .page-numbers');
      
      paginationLinks.each((i, elem) => {
        const text = $(elem).text().trim();
        const pageNum = parseInt(text);
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum;
        }
      });
      
      this.stats.totalPages = maxPage;
      console.log(`✅ Total de páginas: ${maxPage}\n`);
      return maxPage;
    } catch (error) {
      console.error('❌ Error obteniendo páginas:', error.message);
      return 1;
    }
  }

  /**
   * Extraer animes de una página
   */
  async scrapePageAnimes(pageNum) {
    try {
      const url = `${BROWSE_URL}?page=${pageNum}`;
      const response = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      const animes = [];
      
      $('article.Anime').each((i, elem) => {
        try {
          const $item = $(elem);
          const mainLink = $item.find('> a').first();
          const animeUrl = mainLink.attr('href') || '';
          const title = $item.find('h3.Title').text().trim();
          const animeSlug = animeUrl.replace('/anime/', '').split('/').filter(x => x).pop() || '';
          const imageUrl = $item.find('img').first().attr('src') || '';
          
          // Estado - buscar en el texto o usar predeterminado
          const infoText = $item.text();
          const status = infoText.includes('Emision') || infoText.includes('Emitiendo') || infoText.includes('En emisión') ? 'EN_EMISION' : 'FINALIZADO';
          
          // Extraer géneros de la página de listado
          const genres = [];
          
          // Buscar géneros en los enlaces dentro del article
          $item.find('a').each((j, linkElem) => {
            const href = $(linkElem).attr('href');
            // Checar /genre/ o /browse?genre=
            if (href && (href.includes('/genre/') || href.includes('/browse?genre='))) {
              const genreName = $(linkElem).text().trim();
              // Filtrar "Anime" que no es un género real
              if (genreName && genreName !== 'Anime' && !genres.includes(genreName)) {
                genres.push(genreName);
              }
            }
          });
          
          // También buscar en span.genres o .Type
          $item.find('.Type:not(:contains("Anime")), span.genres').each((j, elem) => {
            const genreText = $(elem).text().trim();
            if (genreText && genreText !== 'Anime' && !genres.includes(genreText)) {
              genres.push(genreText);
            }
          });
          
          if (title && title.trim() && animeUrl) {
            animes.push({
              title: title.trim(),
              slug: animeSlug,
              imageUrl: imageUrl.trim(),
              status,
              genres,
              url: animeUrl.trim()
            });
          }
        } catch (err) {
          // Ignorar errores en elementos individuales
        }
      });
      
      return animes;
    } catch (error) {
      console.error(`❌ Error en página ${pageNum}:`, error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   URL: ${error.config?.url}`);
      }
      console.error(`   Stack: ${error.stack}`);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Extraer detalles de un anime individual
   */
  async scrapeAnimeDetails(animeSlug, animeUrl) {
    try {
      const fullUrl = animeUrl.startsWith('http') ? animeUrl : `${this.siteConfig.baseUrl}${animeUrl}`;
      const response = await axios.get(fullUrl, { 
        headers: this.siteConfig.headers, 
        timeout: 15000 
      });
      const $ = cheerio.load(response.data);
      
      // Extraer sinopsis - intentar varios selectores
      let description = '';
      const descSelectors = [
        '.Description p',
        '.Description',
        'div.Description p',
        '.description',
        '.synopsis',
        '.sinopsis',
        '[class*="description"]',
        '[class*="Description"]'
      ];
      
      for (const selector of descSelectors) {
        const text = $(selector).first().text().trim();
        if (text && text.length > 50) {
          description = text;
          break;
        }
      }
      
      // Extraer rating (puede estar en diferentes lugares)
      let rating = 0;
      const ratingSelectors = ['.vote_overview span', '.score', '#votes_prmd', '.rating'];
      for (const selector of ratingSelectors) {
        const ratingText = $(selector).text();
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
          break;
        }
      }
      
      // Extraer número de episodios
      let episodesCount = 0;
      const infoItems = $('.AnmStts, .info-item, .info p, span.fa-television');
      infoItems.each((i, elem) => {
        const text = $(elem).text();
        if (text.includes('Episodios') || text.includes('episodios') || text.includes('Eps')) {
          const match = text.match(/(\d+)/);
          if (match) {
            episodesCount = parseInt(match[1]);
          }
        }
      });
      
      // Extraer géneros de la página de detalles (más preciso)
      const genresFromDetails = [];
      
      // Buscar en diferentes selectores comunes para géneros
      $('.Nvgnrs a, .genres a, nav.Nvgnrs a, .AnmStts .fa-tags + a, span.Type a').each((i, elem) => {
        const genreText = $(elem).text().trim();
        const href = $(elem).attr('href') || '';
        // Solo agregar si es un enlace a /genre/ o /browse?genre= y no es vacío
        if (genreText && (href.includes('/genre/') || href.includes('/browse?genre=')) && genreText !== 'Anime') {
          genresFromDetails.push(genreText);
        }
      });
      
      // También buscar en la tabla de información
      $('p.AnmStts').each((i, elem) => {
        const text = $(elem).text();
        // Buscar línea de géneros
        if (text.includes('Genero') || text.includes('Género')) {
          $(elem).find('a').each((j, link) => {
            const genreText = $(link).text().trim();
            const href = $(link).attr('href') || '';
            if (genreText && (href.includes('/genre/') || href.includes('/browse?genre=')) && genreText !== 'Anime' && !genresFromDetails.includes(genreText)) {
              genresFromDetails.push(genreText);
            }
          });
        }
      });
      
      // Extraer episodios desde JavaScript (AnimeFlv los carga así)
      const episodes = [];
      
      // Buscar en scripts la variable 'episodes'
      $('script').each((i, elem) => {
        const scriptContent = $(elem).html() || '';
        const episodesMatch = scriptContent.match(/var episodes\s*=\s*(\[\[.*?\]\]);/);
        
        if (episodesMatch) {
          try {
            const episodesArray = JSON.parse(episodesMatch[1]);
            // episodesArray tiene formato [[num, id], [num, id], ...]
            episodesArray.forEach(([epNum, epId]) => {
              const epUrl = `${this.siteConfig.baseUrl}/ver/${animeSlug}-${epNum}`;
              episodes.push({
                number: epNum,
                title: `Episodio ${epNum}`,
                url: epUrl
              });
            });
          } catch (err) {
            // Si falla el parse, continuar
          }
        }
      });
      
      // Fallback: buscar en HTML (para otros sitios)
      if (episodes.length === 0) {
        const episodeItems = $('.episode-item, .epi-item, ul.episodes li, .ListCaps li');
        episodeItems.each((i, elem) => {
          try {
            const $ep = $(elem);
            const epUrl = $ep.find('a').attr('href') || '';
            const epTitle = $ep.find('a').attr('title') || $ep.text().trim();
            const epNumber = i + 1;
            
            if (epUrl && epTitle) {
              episodes.push({
                number: epNumber,
                title: epTitle.trim().substring(0, 255),
                url: epUrl.trim().substring(0, 500)
              });
            }
          } catch (err) {
            // Ignorar errores en episodios
          }
        });
      }
      
      return {
        description: description.substring(0, 5000),
        rating: Math.min(rating, 10),
        episodesCount: episodesCount || episodes.length || 0,
        episodes,
        genresFromDetails // Devolver géneros también
      };
    } catch (error) {
      console.error(`  ⚠️ Error extrayendo detalles de ${animeSlug}:`, error.message);
      return {
        description: '',
        rating: 0,
        episodesCount: 0,
        episodes: []
      };
    }
  }

  /**
   * Guardar anime y detalles en BD
   */
  async saveAnimeToDB(anime, details) {
    const sql = getSqlConnection();
    try {
      // Evitar duplicados en memoria
      if (this.allAnimes.has(anime.title.toLowerCase())) {
        this.stats.duplicates++;
        await sql.end();
        return null;
      }

      // Verificar si ya existe en la base de datos
      const existingAnime = await sql`
        SELECT id FROM anime 
        WHERE title = ${anime.title}
      `;

      if (existingAnime.length > 0) {
        this.stats.duplicates++;
        this.allAnimes.add(anime.title.toLowerCase());
        await sql.end();
        return null;
      }

      this.allAnimes.add(anime.title.toLowerCase());

      // Insertar estado
      const statusResult = await sql`
        INSERT INTO anime_status (name) 
        VALUES (${anime.status})
        ON CONFLICT (name) DO NOTHING
        RETURNING id
      `;
      
      let statusId;
      if (statusResult.length > 0) {
        statusId = statusResult[0].id;
      } else {
        const status = await sql`SELECT id FROM anime_status WHERE name = ${anime.status}`;
        statusId = status[0].id;
      }

      // Insertar anime - convertir rating a número explícitamente
      const ratingValue = parseFloat(details.rating) || 0;
      const episodesValue = parseInt(details.episodesCount) || 0;
      
      const animeResult = await sql`
        INSERT INTO anime (title, description, image_url, rating, episodes_count, status_id, audio_type, category)
        VALUES (
          ${anime.title},
          ${details.description || ''},
          ${anime.imageUrl || ''},
          ${ratingValue},
          ${episodesValue},
          ${statusId},
          ${this.audioType},
          ${this.category}
        )
        RETURNING id
      `;

      const animeId = animeResult[0].id;

      // Combinar géneros de listado y detalles
      const allGenres = [...new Set([...anime.genres, ...(details.genresFromDetails || [])])];

      // Insertar géneros
      for (const genreName of allGenres) {
        try {
          const genreResult = await sql`
            INSERT INTO genre (name)
            VALUES (${genreName})
            ON CONFLICT (name) DO NOTHING
            RETURNING id
          `;
          
          let genreId;
          if (genreResult.length > 0) {
            genreId = genreResult[0].id;
          } else {
            const g = await sql`SELECT id FROM genre WHERE name = ${genreName}`;
            if (g.length > 0) genreId = g[0].id;
          }

          if (genreId) {
            await sql`
              INSERT INTO anime_genre (anime_id, genre_id)
              VALUES (${animeId}, ${genreId})
              ON CONFLICT DO NOTHING
            `;
            this.stats.totalGenres++;
          }
        } catch (err) {
          // Ignorar errores de género
        }
      }

      // Insertar episodios
      for (const episode of details.episodes) {
        try {
          await sql`
            INSERT INTO episode (anime_id, episode_number, title, url)
            VALUES (${animeId}, ${episode.number}, ${episode.title}, ${episode.url})
            ON CONFLICT (anime_id, episode_number) DO NOTHING
          `;
          this.stats.totalEpisodes++;
        } catch (err) {
          // Ignorar errores de episodios
        }
      }

      return animeId;
    } catch (error) {
      console.error('❌ Error guardando en BD:', error.message);
      this.stats.errors++;
      return null;
    } finally {
      await sql.end();
    }
  }

  /**
   * Ejecutar scraping completo
   */
  async startFullScraping() {
    const sql = getSqlConnection();
    try {
      console.log('🚀 ============================================');
      console.log('🚀 INICIANDO SCRAPING AVANZADO DE ANIMEFLV');
      console.log('🚀 ============================================\n');
      
      const totalPages = await this.getTotalPages();
      
      for (let page = 1; page <= totalPages; page++) {
        console.log(`📄 Página ${page}/${totalPages}`);
        
        // Obtener animes de la página
        const animes = await this.scrapePageAnimes(page);
        console.log(`  └─ ${animes.length} animes encontrados`);
        
        // Procesar cada anime
        for (let i = 0; i < animes.length; i++) {
          const anime = animes[i];
          process.stdout.write(`  └─ Procesando [${i + 1}/${animes.length}] ${anime.title.substring(0, 50)}...`);
          
          // Extraer detalles
          const details = await this.scrapeAnimeDetails(anime.slug, anime.url);
          
          // Guardar en BD
          const savedId = await this.saveAnimeToDB(anime, details);
          
          if (savedId) {
            const statusEmoji = anime.status === 'EN_EMISION' ? '📡' : '✅';
            const genresInfo = anime.genres.length > 0 ? ` [${anime.genres.length} géneros]` : '';
            const ratingInfo = details.rating > 0 ? ` ⭐${details.rating}` : '';
            console.log(` ${statusEmoji}${ratingInfo}${genresInfo}`);
            this.stats.totalAnimes++;
          } else {
            console.log(' ⏭️  (duplicado)');
          }
          
          // Delay entre requests
          await delay(DELAY_MS);
        }
        
        // Delay entre páginas
        if (page < totalPages) {
          console.log(`  └─ Esperando antes de siguiente página...\n`);
          await delay(DELAY_MS * 2);
        }
      }

      // Mostrar estadísticas
      this.printStats();

    } catch (error) {
      console.error('❌ Error fatal:', error);
    } finally {
      await sql.end();
    }
  }

  /**
   * Scraping de una sola página (para testing o incremental)
   */
  async scrapeSinglePage(pageNum) {
    try {
      console.log('🚀 ============================================');
      console.log(`🚀 SCRAPING PÁGINA ${pageNum}`);
      console.log('🚀 ============================================\n');
      
      this.stats.totalPages = 1;
      
      console.log(`📄 Procesando página ${pageNum}`);
      
      // Obtener animes de la página
      const animes = await this.scrapePageAnimes(pageNum);
      console.log(`  └─ ${animes.length} animes encontrados`);
      
      // Procesar cada anime
      for (let i = 0; i < animes.length; i++) {
        const anime = animes[i];
        process.stdout.write(`  └─ [${i + 1}/${animes.length}] ${anime.title.substring(0, 40)}...`);
        
        // Extraer detalles
        const details = await this.scrapeAnimeDetails(anime.slug, anime.url);
        
        // Guardar en BD
        const savedId = await this.saveAnimeToDB(anime, details);
        
        if (savedId) {
          const statusEmoji = anime.status === 'EN_EMISION' ? '📡' : '✅';
          const genresInfo = anime.genres.length > 0 || (details.genresFromDetails && details.genresFromDetails.length > 0) 
            ? ` [${[...anime.genres, ...(details.genresFromDetails || [])].length} géneros]` 
            : ' [0 géneros]';
          const ratingInfo = details.rating > 0 ? ` ⭐${details.rating}` : ' ⭐0';
          console.log(` ${statusEmoji}${ratingInfo}${genresInfo}`);
          this.stats.totalAnimes++;
        } else {
          console.log(' ⏭️  (duplicado)');
        }
        
        // Delay entre requests
        await delay(DELAY_MS);
      }

      // Mostrar estadísticas
      this.printStats();

    } catch (error) {
      console.error('❌ Error fatal:', error);
    }
  }

  /**
   * Mostrar estadísticas
   */
  printStats() {
    console.log('\n✨ ============================================');
    console.log('✨         SCRAPING COMPLETADO');
    console.log('✨ ============================================');
    console.log(`📊 Páginas procesadas: ${this.stats.totalPages}`);
    console.log(`🎬 Total animes guardados: ${this.stats.totalAnimes}`);
    console.log(`🏷️  Total géneros: ${this.stats.totalGenres}`);
    console.log(`📺 Total episodios: ${this.stats.totalEpisodes}`);
    console.log(`⚠️  Duplicados: ${this.stats.duplicates}`);
    console.log(`❌ Errores: ${this.stats.errors}`);
    console.log('✨ ============================================\n');
  }
}

module.exports = AdvancedAnimeFlvScraper;

// Ejecutar el scraper si se llama directamente
if (require.main === module) {
  (async () => {
    const AdvancedAnimeFlvScraper = require('./advancedAnimeFlvScraper');
    const scraper = new AdvancedAnimeFlvScraper();
    await scraper.startFullScraping();
    process.exit(0);
  })();
}
