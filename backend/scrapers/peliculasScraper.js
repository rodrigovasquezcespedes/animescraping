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

class PeliculasScraper {
  constructor() {
    this.baseUrl = 'https://series24.ink';
    this.peliculasUrl = 'https://series24.ink/peliculas';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Referer': 'https://series24.ink/',
    };
  }

  async scrapePage(offset = 0) {
    try {
      // Primera página es diferente, las siguientes usan AJAX
      const url = offset === 0 
        ? this.peliculasUrl 
        : `${this.baseUrl}/cargar-mas-peliculas.php?num_peliculas_mostradas=${offset}`;
      
      console.log(`   📄 Scrapeando: ${url}`);
      
      const response = await axios.get(url, { headers: this.headers, timeout: 20000 });
      const $ = cheerio.load(response.data);
      
      const peliculas = [];
      
      // Buscar los links de posters
      $('a.Posters-link').each((i, elem) => {
        const $item = $(elem);
        
        const url = $item.attr('href') || '';
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const title = $item.find('.listing-content p').text().trim();
        const imageUrl = $item.find('img').attr('src') || '';
        
        if (title && url) {
          peliculas.push({
            title,
            url: fullUrl,
            imageUrl,
            status: 'FINALIZADO',
            audioType: 'SUBTITULADO',
            category: 'PELICULA'
          });
        }
      });
      
      console.log(`      ✅ Encontradas: ${peliculas.length} películas`);
      return peliculas;
      
    } catch (error) {
      console.log(`      ❌ Error en offset ${offset}:`, error.message);
      return [];
    }
  }

  async savePeliculas(peliculasList) {
    const sql = getSqlConnection();
    let saved = 0;
    let duplicates = 0;

    for (const pelicula of peliculasList) {
      try {
        // Verificar si ya existe
        const existing = await sql`
          SELECT id FROM anime WHERE title = ${pelicula.title} AND category = 'PELICULA'
        `;

        if (existing.length > 0) {
          duplicates++;
          continue;
        }

        // Obtener status_id
        const statusResult = await sql`
          SELECT id FROM anime_status WHERE name = 'FINALIZADO'
        `;
        const statusId = statusResult[0]?.id || 2;

        // Insertar
        await sql`
          INSERT INTO anime (title, description, image_url, rating, episodes_count, status_id, audio_type, category, genre)
          VALUES (
            ${pelicula.title},
            ${'Película disponible en Series24'},
            ${pelicula.imageUrl},
            ${0},
            ${1},
            ${statusId},
            ${pelicula.audioType},
            ${pelicula.category},
            ${'General'}
          )
        `;
        saved++;
        
      } catch (error) {
        console.log(`   ⚠️  Error guardando "${pelicula.title}":`, error.message);
      }
    }

    await sql.end();
    return { saved, duplicates };
  }

  async scrapeAll(maxBatches = 20) {
    console.log('🎬 =============================================');
    console.log('🎬  SCRAPING DE PELÍCULAS - SERIES24.INK');
    console.log('🎬 =============================================\n');

    let totalSaved = 0;
    let totalDuplicates = 0;
    const batchSize = 24; // El sitio carga de 24 en 24

    for (let batch = 0; batch < maxBatches; batch++) {
      const offset = batch * batchSize;
      console.log(`\n📄 Batch ${batch + 1}/${maxBatches} (offset: ${offset})`);
      
      const peliculas = await this.scrapePage(offset);
      
      if (peliculas.length === 0) {
        console.log('   ⚠️  No se encontraron más películas, terminando...');
        break;
      }
      
      const { saved, duplicates } = await this.savePeliculas(peliculas);
      totalSaved += saved;
      totalDuplicates += duplicates;
      
      console.log(`   💾 Guardadas: ${saved} | Duplicadas: ${duplicates}`);
      
      // Esperar entre peticiones
      if (batch < maxBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    console.log('\n✨ ============================================');
    console.log('✨         SCRAPING COMPLETADO');
    console.log('✨ ============================================');
    console.log(`📊 Batches procesados: ${maxBatches}`);
    console.log(`🎬 Total películas guardadas: ${totalSaved}`);
    console.log(`⚠️  Total duplicadas: ${totalDuplicates}`);
    console.log('✨ ============================================\n');

    return { totalSaved, totalDuplicates };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const scraper = new PeliculasScraper();
  scraper.scrapeAll(10).then(() => process.exit(0)).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = PeliculasScraper;
