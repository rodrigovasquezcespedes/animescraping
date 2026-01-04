#!/usr/bin/env node

/**
 * Script para scrapear anime SUBTITULADO
 */

const AdvancedAnimeFlvScraper = require('./advancedAnimeFlvScraper');

async function scrapeSubbed() {
  console.log('📝 =============================================');
  console.log('📝  SCRAPING DE ANIME SUBTITULADO');
  console.log('📝 =============================================\n');
  
  const scraper = new AdvancedAnimeFlvScraper('SUBTITULADO');
  
  // Obtener total de páginas disponibles
  const totalPages = await scraper.getTotalPages();
  console.log(`📊 Total de páginas encontradas: ${totalPages}\n`);
  
  // Scrapear todas las páginas
  for (let page = 1; page <= totalPages; page++) {
    await scraper.scrapeSinglePage(page);
    
    // Pausa entre páginas para evitar sobrecargar el servidor
    if (page < totalPages) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 =============================================');
  console.log('🎉  SCRAPING COMPLETADO DE TODAS LAS PÁGINAS');
  console.log('🎉 =============================================');
}

scrapeSubbed();
