#!/usr/bin/env node

/**
 * Script para probar scraping en un sitio nuevo
 * Uso: node testNewSite.js <URL>
 */

const axios = require('axios');
const cheerio = require('cheerio');

const url = process.argv[2];

if (!url) {
  console.log('❌ Uso: node testNewSite.js <URL>');
  console.log('Ejemplo: node testNewSite.js https://www.animefenix.tv/animes?tipo[]=Latino');
  process.exit(1);
}

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
};

async function testSite() {
  try {
    console.log(`🔍 Probando: ${url}\n`);
    
    const response = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    console.log('✅ Conexión exitosa!\n');
    console.log('═══════════════════════════════════════════════\n');
    
    // Buscar posibles contenedores de anime
    console.log('📦 POSIBLES CONTENEDORES DE ANIME:\n');
    
    const containers = [
      'article', '.anime', '.Anime', '.item', '.anime-item',
      '.card', '.anime-card', '.post', '.entry'
    ];
    
    containers.forEach(selector => {
      const count = $(selector).length;
      if (count > 0 && count < 100) {
        console.log(`   ${selector}: ${count} elementos`);
      }
    });
    
    // Buscar títulos
    console.log('\n📝 TÍTULOS ENCONTRADOS (primeros 5):\n');
    
    const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.Title', '.anime-title'];
    titleSelectors.forEach(selector => {
      $(selector).slice(0, 5).each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length < 100) {
          console.log(`   [${selector}] ${text}`);
        }
      });
    });
    
    // Buscar imágenes
    console.log('\n🖼️  IMÁGENES (primeras 3):\n');
    $('img').slice(0, 3).each((i, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt');
      if (src) {
        console.log(`   ${i+1}. ${src}`);
        if (alt) console.log(`      Alt: ${alt}`);
      }
    });
    
    // Buscar enlaces
    console.log('\n🔗 ENLACES DE ANIME (primeros 5):\n');
    $('a[href*="/anime"], a[href*="ver"]').slice(0, 5).each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      console.log(`   ${i+1}. ${href}`);
      if (text) console.log(`      Texto: ${text.substring(0, 50)}`);
    });
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('\n💡 SUGERENCIAS PARA siteConfig.js:\n');
    
    // Generar sugerencia de configuración
    const mainContainer = containers.find(s => $(s).length > 5 && $(s).length < 100) || 'article';
    console.log(`selectors: {`);
    console.log(`  animeCard: '${mainContainer}',`);
    console.log(`  title: 'h3, h2, .title',`);
    console.log(`  link: 'a',`);
    console.log(`  image: 'img',`);
    console.log(`  genres: 'a[href*="/genero/"]'`);
    console.log(`}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   ${error.response.status === 403 ? '⚠️  Sitio con protección anti-scraping' : ''}`);
    }
  }
}

testSite();
