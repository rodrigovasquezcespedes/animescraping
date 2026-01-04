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

class DoramasScraper {
  constructor() {
    this.baseUrl = 'https://doramasmp4.my';
    this.browseUrl = 'https://doramasmp4.my/series';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    };
    
    // Géneros/categorías a scrapear (URLs exactas del sitio)
    this.genres = [
      'drama',
      'comedy',
      'mystery',
      'sci-fi-fantasy',
      'crime',
      'action-adventure',
      'family',
      'reality',
      'soap',
      'documentary',
      'war-politics'
    ];
  }

  async detectTotalPages(genreUrl = null) {
    try {
      const url = genreUrl || this.browseUrl;
      console.log(`🔍 Detectando páginas en: ${url}`);
      
      const response = await axios.get(url, { headers: this.headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      const paginationLinks = $('.pagination a');
      let maxPage = 1;
      
      paginationLinks.each((i, elem) => {
        const href = $(elem).attr('href') || '';
        const match = href.match(/page[=/](\d+)/);
        if (match) {
          const pageNum = parseInt(match[1]);
          if (pageNum > maxPage) maxPage = pageNum;
        }
      });
      
      console.log(`   ✅ Total de páginas: ${maxPage}`);
      return maxPage;
    } catch (error) {
      console.log(`   ❌ Error detectando páginas:`, error.message);
      return 1;
    }
  }

  async scrapePage(pageNum, pageUrl = null, genre = 'general') {
    try {
      const url = pageUrl || `${this.browseUrl}?page=${pageNum}`;
      
      const response = await axios.get(url, { headers: this.headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      const doramas = [];
      
      $('article.item').each((i, elem) => {
        const $item = $(elem);
        
        const $link = $item.find('a').first();
        const url = $link.attr('href') || '';
        const title = $link.attr('title') || $link.text().trim();
        
        const $img = $item.find('img').first();
        const imageUrl = $img.attr('src') || $img.attr('data-src') || '';
        
        if (title && url) {
          doramas.push({
            title: title.replace(/\d{4}$/, '').trim(),
            url,
            imageUrl,
            status: 'FINALIZADO',
            audioType: 'LATINO',
            category: 'DORAMA',
            genre: this.translateGenre(genre)
          });
        }
      });
      
      console.log(`      ✅ Encontrados: ${doramas.length} doramas`);
      return doramas;
      
    } catch (error) {
      console.log(`      ❌ Error en página ${pageNum}:`, error.message);
      return [];
    }
  }
  translateGenre(genre) {
    const translations = {
      'drama': 'Drama',
      'comedy': 'Comedia',
      'mystery': 'Misterio',
      'sci-fi-fantasy': 'Ciencia Ficción',
      'crime': 'Crimen',
      'action-adventure': 'Acción',
      'family': 'Familia',
      'reality': 'Reality',
      'soap': 'Telenovela',
      'documentary': 'Documental',
      'war-politics': 'Guerra'
    };
    return translations[genre] || 'General';
  }
  async saveDoramas(doramas) {
    const sql = await getSqlConnection();
    let saved = 0;
    let duplicates = 0;

    for (const dorama of doramas) {
      try {
        // Verificar si ya existe
        const existing = await sql`
          SELECT id FROM anime WHERE title = ${dorama.title} AND category = 'DORAMA'
        `;

        if (existing.length > 0) {
          duplicates++;
          continue;
        }

        // Obtener status_id (FINALIZADO = 2)
        const statusResult = await sql`
          SELECT id FROM anime_status WHERE name = 'FINALIZADO'
        `;
        const statusId = statusResult[0]?.id || 2;

        // Insertar
        await sql`
          INSERT INTO anime (title, description, image_url, rating, episodes_count, status_id, audio_type, category, genre)
          VALUES (
            ${dorama.title},
            ${'Dorama disponible'},
            ${dorama.imageUrl},
            ${0},
            ${1},
            ${statusId},
            ${dorama.audioType},
            ${dorama.category},
            ${dorama.genre}
          )
        `;
        saved++;
        
      } catch (error) {
        console.log(`   ⚠️  Error guardando "${dorama.title}":`, error.message);
      }
    }

    return { saved, duplicates };
  }

  async scrapeGenre(genre, maxPages = 10) {
    console.log(`\n🎭 Scrapeando género: ${genre.toUpperCase()}`);
    
    const genreUrl = `${this.baseUrl}/genero/${genre}`;
    const totalPages = await this.detectTotalPages(genreUrl);
    const pagesToScrape = Math.min(totalPages, maxPages);
    
    let totalSaved = 0;
    let totalDuplicates = 0;
    
    for (let page = 1; page <= pagesToScrape; page++) {
      const pageUrl = `${genreUrl}/page/${page}/`;
      console.log(`   📄 Página ${page}/${pagesToScrape}: ${pageUrl}`);
      
      const doramas = await this.scrapePage(page, pageUrl, genre);
      
      if (doramas.length > 0) {
        const { saved, duplicates } = await this.saveDoramas(doramas);
        totalSaved += saved;
        totalDuplicates += duplicates;
        console.log(`   💾 Guardados: ${saved} | Duplicados: ${duplicates}`);
      }
      
      // Esperar entre páginas
      if (page < pagesToScrape) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🏁 ${genre}: ${totalSaved} guardados, ${totalDuplicates} duplicados`);
    return { saved: totalSaved, duplicates: totalDuplicates };
  }

  async scrapeAll() {
    console.log('🎭 =============================================');
    console.log('🎭  SCRAPING DE DORAMAS POR GÉNEROS');
    console.log('🎭 =============================================\n');

    let grandTotalSaved = 0;
    let grandTotalDuplicates = 0;
    
    // Scrapear cada género
    for (const genre of this.genres) {
      try {
        const { saved, duplicates } = await this.scrapeGenre(genre, 5); // Máximo 5 páginas por género
        grandTotalSaved += saved;
        grandTotalDuplicates += duplicates;
      } catch (error) {
        console.log(`❌ Error en género ${genre}:`, error.message);
      }
      
      // Esperar entre géneros
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✨ ============================================');
    console.log('✨         SCRAPING COMPLETADO');
    console.log('✨ ============================================');
    console.log(`📊 Géneros procesados: ${this.genres.length}`);
    console.log(`🎬 Total doramas guardados: ${grandTotalSaved}`);
    console.log(`⚠️  Total duplicados: ${grandTotalDuplicates}`);
    console.log('✨ ============================================\n');
  }
}

module.exports = DoramasScraper;
