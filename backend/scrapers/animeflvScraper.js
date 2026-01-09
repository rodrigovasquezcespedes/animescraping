// backend/scrapers/animeflvScraper.js
// Scraper centralizado de AnimeFLV: animes, episodios, servidores y guardado en BD

const puppeteer = require('puppeteer');
const { getSqlConnection, sleep } = require('../utils');

async function scrapeAnimeFlvAndSave({ pageNum = 1, browser, page, sql } = {}) {
  const BASE_URL = 'https://www3.animeflv.net';
  const BROWSE_URL = `${BASE_URL}/browse?page=${pageNum}`;
  console.log(`\n[INFO] Procesando página ${pageNum}: ${BROWSE_URL}`);
  await page.goto(BROWSE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Extraer lista de animes
  const animes = await page.evaluate(() => {
    const cards = document.querySelectorAll('.Anime.alt, .Anime, .Card, .card, .Item, .item, .ListAnimes .Anime');
    const list = [];
    cards.forEach(card => {
      const title = card.querySelector('.Title, .title, h3, h2, .card-title')?.textContent?.trim() || '';
      const url = card.querySelector('a')?.getAttribute('href') || '';
      const image_url = card.querySelector('img')?.getAttribute('src') || '';
      const description = card.querySelector('.Description, .description, .sinopsis, .synopsis')?.textContent?.trim() || '';
      const status = card.querySelector('.Type, .type, .Status, .status')?.textContent?.trim() || '';
      const genres = [];
      card.querySelectorAll('.Genres a, .genres a, .tags a, .genero a').forEach(g => {
        if (g.textContent) genres.push(g.textContent.trim());
      });
      if (title && url) {
        list.push({ title, slug: url.split('/').pop(), url, image_url, description, status, genres });
      }
    });
    return list;
  });

  // sql y browser se pasan como argumento global
  let totalAnimes = 0;
  for (let i = 0; i < animes.length; i++) {
    const anime = animes[i];
    console.log(`[INFO] [P${pageNum}] Analizando anime ${i + 1}/${animes.length}: ${anime.title}`);
    // Verificar si el anime ya existe por título
    const existingAnime = await sql`SELECT id FROM anime WHERE title = ${anime.title}`;
    let animeId = existingAnime[0]?.id;
    const animeUrl = anime.url.startsWith('http') ? anime.url : `${BASE_URL}${anime.url}`;
    // Scrape detalles de anime
    await page.goto(animeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const details = await page.evaluate(() => {
      let description = '';
      const descSelectors = [
        '.Description p', '.Description', 'div.Description p', '.description', '.synopsis', '.sinopsis', '[class*="description"], [class*="Description"]'
      ];
      // backend/scrapers/animeflvScraper.js
      // Scraper centralizado y optimizado para AnimeFLV
      // Extrae animes, episodios, servidores y guarda todo en la base de datos
      for (const selector of descSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent) {
          description = el.textContent.trim();
          break;
        }
      }
      let rating = 0;
      const ratingSelectors = ['.vote_overview span', '.score', '#votes_prmd', '.rating'];
      for (const selector of ratingSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent) {
          const match = el.textContent.match(/(\d+\.?\d*)/);
          if (match) {
            rating = parseFloat(match[1]);
            break;
          }
        }
      }
      const genres = [];
      document.querySelectorAll('.Nvgnrs a, .genres a, nav.Nvgnrs a, .AnmStts .fa-tags + a, span.Type a').forEach(el => {
        if (el.textContent) genres.push(el.textContent.trim());
      });
      // Episodios
      const episodes = [];
      document.querySelectorAll('.ListCaps li, ul.episodes li, .episode-item, .epi-item').forEach((li, idx) => {
        const a = li.querySelector('a');
        const epUrl = a ? a.href : '';
        let epTitle = a ? (a.title || a.textContent.trim()) : li.textContent.trim();
        // Eliminar la palabra 'cap' y el número al inicio del título
        epTitle = epTitle.replace(/^cap\.?\s*\d+\s*-?\s*/i, '');
        const epNumber = idx + 1;
        episodes.push({ number: epNumber, title: epTitle, url: epUrl });
      });
      return { description, rating, genres, episodes };
    });
    // Si el anime no existe, insertarlo y sus episodios
    if (!animeId) {
      try {
        const result = await sql`
          INSERT INTO anime (title, description, image_url, rating, episodes_count, status_id)
          VALUES (${anime.title}, ${details.description || anime.description || ''}, ${anime.image_url}, ${details.rating || 0}, ${details.episodes.length}, 1)
          RETURNING id`;
        animeId = result[0]?.id;
        // Géneros
        if (details.genres && details.genres.length > 0) {
          for (const genre of details.genres) {
            const g = await sql`INSERT INTO genre (name) VALUES (${genre}) ON CONFLICT (name) DO NOTHING RETURNING id`;
            const genreId = g[0]?.id || (await sql`SELECT id FROM genre WHERE name = ${genre}`)[0]?.id;
            if (genreId) {
              await sql`INSERT INTO anime_genre (anime_id, genre_id) VALUES (${animeId}, ${genreId}) ON CONFLICT DO NOTHING`;
            }
          }
        }
        // Episodios y servidores
        for (const ep of details.episodes) {
          if (!ep.url) continue;
          await page.goto(ep.url, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(2000);
          const servers = await page.evaluate(() => {
            let servers = [];
            try {
              let videosVar = null;
              for (const script of document.scripts) {
                if (script.textContent.includes('var videos =')) {
                  const match = script.textContent.match(/var videos = (\{[\s\S]*?\});/);
                  if (match) {
                    videosVar = match[1];
                    break;
                  }
                }
              }
              if (videosVar) {
                const videos = JSON.parse(videosVar.replace(/\\/g, ''));
                if (videos.SUB && Array.isArray(videos.SUB)) {
                  for (const srv of videos.SUB) {
                    servers.push({
                      name: srv.title || srv.server,
                      url: srv.code || srv.url || ''
                    });
                  }
                }
              }
            } catch (e) {}
            return servers;
          });
          ep.servers = servers;
          const epResult = await sql`
            INSERT INTO episode (anime_id, episode_number, title, url)
            VALUES (${animeId}, ${ep.number}, ${ep.title || ''}, ${ep.url || ''})
            RETURNING id`;
          const episodeId = epResult[0]?.id;
          if (!episodeId) continue;
          if (ep.servers && ep.servers.length > 0) {
            for (const srv of ep.servers) {
              await sql`
                INSERT INTO episode_server (episode_id, name, url)
                VALUES (${episodeId}, ${srv.name}, ${srv.url})
                ON CONFLICT (episode_id, url) DO NOTHING`;
            }
          }
        }
        totalAnimes++;
        console.log(`✅ ${anime.title} guardado (${details.episodes.length} episodios)`);
      } catch (error) {
        console.error('❌ Error guardando en BD:', error.message);
      }
    } else {
      // Si el anime ya existe, solo agregar episodios nuevos
      for (const ep of details.episodes) {
        // Verificar si el episodio ya existe
        const existingEp = await sql`SELECT id FROM episode WHERE anime_id = ${animeId} AND episode_number = ${ep.number}`;
        if (existingEp.length > 0) continue;
        if (!ep.url) continue;
        await page.goto(ep.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);
        const servers = await page.evaluate(() => {
          let servers = [];
          try {
            let videosVar = null;
            for (const script of document.scripts) {
              if (script.textContent.includes('var videos =')) {
                const match = script.textContent.match(/var videos = (\{[\s\S]*?\});/);
                if (match) {
                  videosVar = match[1];
                  break;
                }
              }
            }
            if (videosVar) {
              const videos = JSON.parse(videosVar.replace(/\\/g, ''));
              if (videos.SUB && Array.isArray(videos.SUB)) {
                for (const srv of videos.SUB) {
                  servers.push({
                    name: srv.title || srv.server,
                    url: srv.code || srv.url || ''
                  });
                }
              }
            }
          } catch (e) {}
          return servers;
        });
        ep.servers = servers;
        const epResult = await sql`
          INSERT INTO episode (anime_id, episode_number, title, url)
          VALUES (${animeId}, ${ep.number}, ${ep.title || ''}, ${ep.url || ''})
          RETURNING id`;
        const episodeId = epResult[0]?.id;
        if (!episodeId) continue;
        if (ep.servers && ep.servers.length > 0) {
          for (const srv of ep.servers) {
            await sql`
              INSERT INTO episode_server (episode_id, name, url)
              VALUES (${episodeId}, ${srv.name}, ${srv.url})
              ON CONFLICT (episode_id, url) DO NOTHING`;
          }
        }
        console.log(`➕ Episodio nuevo agregado a ${anime.title}: ${ep.title}`);
      }
    }
    await sleep(1000);
  }
  return totalAnimes;
}




// Scrapea todas las páginas de AnimeFLV (1 a 150)
async function scrapeAllAnimeFlvPages() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const sql = getSqlConnection();
  let total = 0;
  for (let pageNum = 1; pageNum <= 150; pageNum++) {
    console.log(`\n==============================\n>>> Scrapeando página ${pageNum} de 150 <<<\n==============================`);
    try {
      await scrapeAnimeFlvAndSave({ pageNum, browser, page, sql });
      total++;
    } catch (e) {
      console.error(`Error en página ${pageNum}:`, e.message);
    }
    await sleep(2000); // Espera entre páginas para evitar bloqueo
  }
  await browser.close();
  await sql.end();
  console.log(`\nScraping de todas las páginas completado. Total páginas procesadas: ${total}`);
}

if (require.main === module && process.argv[2] === 'all') {
  scrapeAllAnimeFlvPages().then(() => process.exit(0));
}

module.exports = { scrapeAnimeFlvAndSave, scrapeAllAnimeFlvPages };
