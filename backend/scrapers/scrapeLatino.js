#!/usr/bin/env node

/**
 * Script para scrapear anime LATINO
 */

const AdvancedAnimeFlvScraper = require('./advancedAnimeFlvScraper');

async function scrapeLatin() {
  console.log('🇲🇽 =============================================');
  console.log('🇲🇽  SCRAPING DE ANIME LATINO');
  console.log('🇲🇽 =============================================\n');
  
  const scraper = new AdvancedAnimeFlvScraper('LATINO');
  
  // Detectar total de páginas automáticamente
  const totalPages = await scraper.getTotalPages();
  console.log(`📊 Total de páginas detectadas: ${totalPages}\n`);
  
  // Scrapear todas las páginas
  for (let page = 1; page <= totalPages; page++) {
    await scraper.scrapeSinglePage(page);
  }
}

scrapeLatin();
