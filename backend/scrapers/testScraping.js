#!/usr/bin/env node

/**
 * Test rápido para verificar géneros, status y rating
 */

const AdvancedAnimeFlvScraper = require('./advancedAnimeFlvScraper');

async function test() {
  const scraper = new AdvancedAnimeFlvScraper();
  
  console.log('🧪 TEST SCRAPING - Solo primeros 3 animes\n');
  
  try {
    // Obtener animes de la página 1
    const animes = await scraper.scrapePageAnimes(1);
    console.log(`✅ Encontrados ${animes.length} animes\n`);
    
    // Procesar solo los primeros 3
    for (let i = 0; i < Math.min(3, animes.length); i++) {
      const anime = animes[i];
      console.log(`\n[${i+1}] ${anime.title}`);
      console.log(`   URL: ${anime.url}`);
      console.log(`   Status: ${anime.status}`);
      console.log(`   Géneros de listado: ${anime.genres.join(', ') || 'ninguno'}`);
      
      // Extraer detalles
      console.log(`   Extrayendo detalles...`);
      const details = await scraper.scrapeAnimeDetails(anime.slug, anime.url);
      console.log(`   Rating: ${details.rating}`);
      console.log(`   Episodios: ${details.episodesCount}`);
      console.log(`   Géneros de detalles: ${(details.genresFromDetails || []).join(', ') || 'ninguno'}`);
      console.log(`   Descripción: ${details.description.substring(0, 100)}...`);
      
      // Guardar
      console.log(`   Guardando...`);
      const id = await scraper.saveAnimeToDB(anime, details);
      console.log(`   ${id ? '✅ Guardado con ID: ' + id : '⚠️  Duplicado'}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Test completado`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

test();
