#!/usr/bin/env node

/**
 * Script para scrapear DORAMAS
 */

const DoramasScraper = require('./doramasScraper');

async function scrapeDoramas() {
  const scraper = new DoramasScraper();
  await scraper.scrapeAll();
}

scrapeDoramas().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

