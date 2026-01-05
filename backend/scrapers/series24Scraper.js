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

class Series24Scraper {
  constructor() {
    this.baseUrl = 'https://series24.ink';
    this.seriesUrl = 'https://series24.ink/series';
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
        ? this.seriesUrl 
        : `${this.baseUrl}/cargar-mas-series.php?num_peliculas_mostradas=${offset}`;
      
      console.log(`   📄 Scrapeando: ${url}`);
      
      const response = await axios.get(url, { headers: this.headers, timeout: 20000 });
      const $ = cheerio.load(response.data);
      
      const series = [];
      
      // Buscar los links de posters
      const posterLinks = $('a.Posters-link').toArray();
      for (const elem of posterLinks) {
        const $item = $(elem);
        const url = $item.attr('href') || '';
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const title = $item.find('.listing-content p').text().trim();
        const imageUrl = $item.find('img').attr('src') || '';
        if (title && url) {
          // Extraer descripción y fecha de estreno desde la página de detalle
          let description = '';
          let releaseDate = '';
          try {
            const detailResp = await axios.get(fullUrl, { headers: this.headers, timeout: 20000 });
            const $$ = cheerio.load(detailResp.data);
            // Descripción: buscar div.sinopsis, div#sinopsis, o el primer p largo
            description = $$(".sinopsis, #sinopsis, .description, .Description").first().text().trim();
            if (!description) {
              description = $$("p").filter((i, el) => $$(el).text().length > 40).first().text().trim();
            }
            // Fecha de estreno: buscar span, div, o p que contenga "Fecha de estreno" o "Estreno"
            $$("span, div, p, li").each((i, el) => {
              const txt = $$(el).text();
              if (/Fecha de estreno|Estreno/i.test(txt)) {
                const match = txt.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})|(\d{4})/);
                if (match) releaseDate = match[0];
              }
            });
          } catch (err) {
            // Si falla, dejar vacío
          }
          series.push({
            title,
            url: fullUrl,
            imageUrl,
            status: 'EN EMISION',
            audioType: 'SUBTITULADO',
            category: 'SERIE',
            description,
            releaseDate
          });
        }
      }
      
      console.log(`      ✅ Encontradas: ${series.length} series`);
      return series;
      
    } catch (error) {
      console.log(`      ❌ Error en offset ${offset}:`, error.message);
      return [];
    }
  }

  async saveSeries(seriesList) {
    const sql = getSqlConnection();
    let saved = 0;
    let duplicates = 0;

    for (const serie of seriesList) {
      try {
        // Verificar si ya existe
        const existing = await sql`
          SELECT id FROM anime WHERE title = ${serie.title} AND category = 'SERIE'
        `;

        if (existing.length > 0) {
          duplicates++;
          continue;
        }

        // Obtener status_id
        const statusResult = await sql`
          SELECT id FROM anime_status WHERE name = 'EN EMISION'
        `;
        const statusId = statusResult[0]?.id || 1;

        // Insertar
        await sql`
          INSERT INTO anime (title, description, image_url, rating, episodes_count, status_id, audio_type, category, genre, release_date)
          VALUES (
            ${serie.title},
            ${serie.description || 'Serie disponible en Series24'},
            ${serie.imageUrl},
            ${0},
            ${1},
            ${statusId},
            ${serie.audioType},
            ${serie.category},
            ${'General'},
            ${serie.releaseDate || null}
          )
        `;
        saved++;
        
      } catch (error) {
        console.log(`   ⚠️  Error guardando "${serie.title}":`, error.message);
      }
    }

    await sql.end();
    return { saved, duplicates };
  }

  async scrapeAll(maxBatches = 10) {
    console.log('📺 =============================================');
    console.log('📺  SCRAPING DE SERIES24.INK');
    console.log('📺 =============================================\n');

    let totalSaved = 0;
    let totalDuplicates = 0;
    const batchSize = 24; // El sitio carga de 24 en 24

    for (let batch = 0; batch < maxBatches; batch++) {
      const offset = batch * batchSize;
      console.log(`\n📄 Batch ${batch + 1}/${maxBatches} (offset: ${offset})`);
      
      const series = await this.scrapePage(offset);
      
      if (series.length === 0) {
        console.log('   ⚠️  No se encontraron más series, terminando...');
        break;
      }
      
      const { saved, duplicates } = await this.saveSeries(series);
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
    console.log(`🎬 Total series guardadas: ${totalSaved}`);
    console.log(`⚠️  Total duplicadas: ${totalDuplicates}`);
    console.log('✨ ============================================\n');

    return { totalSaved, totalDuplicates };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const scraper = new Series24Scraper();
  scraper.scrapeAll(5).then(() => process.exit(0)).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = Series24Scraper;
