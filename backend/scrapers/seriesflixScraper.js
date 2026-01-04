const axios = require('axios');
const cheerio = require('cheerio');
const postgres = require('postgres');

function getSqlConnection() {
  return postgres({
    host: 'localhost',
    port: 5432,
    database: 'animescraping',
    username: 'postgres',
    password: 'postgres'
  });
}

class SeriesflixScraper {
  constructor() {
    this.baseUrl = 'https://seriesflix.wtf';
    this.seriesUrl = 'https://seriesflix.wtf/series-online/';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Referer': 'https://seriesflix.wtf/'
    };
    this.delay = 1500; // 1.5 segundos entre requests
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  parseSeriesFromHtml(html) {
    const series = [];
    const $ = cheerio.load(html);

    // Buscar los items de series
    $('li.TPostMv article.TPost').each((index, element) => {
      try {
        const $el = $(element);
        
        // URL y título
        const linkEl = $el.find('a').first();
        const url = linkEl.attr('href') || '';
        const title = $el.find('h2.Title').text().trim() || 
                      $el.find('.Title').first().text().trim();
        
        // Imagen - usar data-src para lazy loading
        const imgEl = $el.find('img.imglazy');
        let image = imgEl.attr('data-src') || imgEl.attr('src') || '';
        
        // Arreglar URLs de imagen
        if (image.startsWith('//')) {
          image = 'https:' + image;
        }
        
        // Año
        const year = $el.find('.Date').first().text().trim() || 
                     $el.find('.Qlty.Yr').text().trim();
        
        // Género
        const genreEl = $el.find('.Genre a');
        const genres = [];
        genreEl.each((i, g) => {
          const genre = $(g).text().replace(',', '').trim();
          if (genre && genre !== 'Ver Online') {
            genres.push(genre);
          }
        });
        
        // Descripción
        const description = $el.find('.Description p').first().text().trim();

        if (title && url) {
          series.push({
            title,
            url,
            image,
            year,
            genre: genres.join(', '),
            description,
            source: 'seriesflix'
          });
        }
      } catch (error) {
        console.error('Error parsing series item:', error.message);
      }
    });

    return series;
  }

  async getTotalPages(html) {
    const $ = cheerio.load(html);
    // Buscar el último número de página
    const lastPageLink = $('.wp-pagenavi .page-link').last().attr('href');
    if (lastPageLink) {
      const match = lastPageLink.match(/page\/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return 1;
  }

  async scrapeSeries(maxPages = null) {
    console.log('🎬 Iniciando scraping de SeriesFlix...');
    
    // Obtener primera página para saber el total
    const firstPageHtml = await this.fetchPage(this.seriesUrl);
    if (!firstPageHtml) {
      console.error('No se pudo acceder a SeriesFlix');
      return [];
    }

    const totalPages = await this.getTotalPages(firstPageHtml);
    const pagesToScrape = maxPages ? Math.min(maxPages, totalPages) : totalPages;
    
    console.log(`📊 Total de páginas detectadas: ${totalPages}`);
    console.log(`📊 Páginas a scrapear: ${pagesToScrape}`);

    const allSeries = [];
    
    // Procesar primera página
    const firstPageSeries = this.parseSeriesFromHtml(firstPageHtml);
    allSeries.push(...firstPageSeries);
    console.log(`✅ Página 1/${pagesToScrape}: ${firstPageSeries.length} series`);

    // Procesar páginas restantes
    for (let page = 2; page <= pagesToScrape; page++) {
      await this.sleep(this.delay);
      
      const pageUrl = `${this.seriesUrl}page/${page}/`;
      const html = await this.fetchPage(pageUrl);
      
      if (html) {
        const pageSeries = this.parseSeriesFromHtml(html);
        allSeries.push(...pageSeries);
        console.log(`✅ Página ${page}/${pagesToScrape}: ${pageSeries.length} series (Total: ${allSeries.length})`);
      } else {
        console.log(`⚠️ Página ${page} no disponible, continuando...`);
      }

      // Progreso cada 10 páginas
      if (page % 10 === 0) {
        console.log(`📈 Progreso: ${page}/${pagesToScrape} páginas procesadas - ${allSeries.length} series encontradas`);
      }
    }

    console.log(`\n🎉 Scraping completado: ${allSeries.length} series encontradas`);
    return allSeries;
  }

  async saveSeriesToDatabase(series) {
    const sql = getSqlConnection();
    console.log(`\n💾 Guardando ${series.length} series en la base de datos...`);
    
    let saved = 0;
    let errors = 0;
    let duplicates = 0;

    // Obtener status_id para 'EN EMISION'
    const statusResult = await sql`
      SELECT id FROM anime_status WHERE name = 'EN EMISION'
    `;
    const statusId = statusResult[0]?.id || 1;

    for (const serie of series) {
      try {
        // Verificar si ya existe
        const existing = await sql`
          SELECT id FROM anime WHERE title = ${serie.title} AND category = 'SERIESFLIX'
        `;

        if (existing.length > 0) {
          duplicates++;
          continue;
        }

        // Insertar
        await sql`
          INSERT INTO anime (title, description, image_url, rating, episodes_count, status_id, audio_type, category, genre)
          VALUES (
            ${serie.title},
            ${serie.description || 'Serie disponible en SeriesFlix'},
            ${serie.image},
            ${0},
            ${serie.year || 'N/A'},
            ${statusId},
            ${'SUBTITULADO'},
            ${'SERIESFLIX'},
            ${serie.genre || 'Series'}
          )
        `;
        saved++;
        
        if (saved % 100 === 0) {
          console.log(`  💾 Guardadas: ${saved} series...`);
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`  ❌ Error guardando "${serie.title}":`, error.message);
        }
      }
    }

    await sql.end();

    console.log(`\n📊 Resumen de guardado:`);
    console.log(`  ✅ Series guardadas: ${saved}`);
    console.log(`  🔄 Duplicados omitidos: ${duplicates}`);
    console.log(`  ❌ Errores: ${errors}`);
    
    return { saved, duplicates, errors };
  }

  async run(maxPages = null, saveToDb = true) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('       SERIESFLIX SCRAPER - Series Online');
    console.log('═══════════════════════════════════════════════════════\n');

    const series = await this.scrapeSeries(maxPages);
    
    if (series.length > 0 && saveToDb) {
      await this.saveSeriesToDatabase(series);
    }

    return series;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const scraper = new SeriesflixScraper();
  
  // Argumento para limitar páginas: node seriesflixScraper.js 10
  const maxPages = process.argv[2] ? parseInt(process.argv[2]) : null;
  
  scraper.run(maxPages)
    .then(() => {
      console.log('\n✅ Proceso finalizado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = SeriesflixScraper;
