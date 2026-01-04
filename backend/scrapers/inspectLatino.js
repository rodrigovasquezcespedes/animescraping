#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};

async function inspectLatinoSite() {
  try {
    console.log('🔍 Inspeccionando AnimeonlineNinja (Latino)...\n');
    
    // Página de listado
    const listUrl = 'https://ww3.animeonline.ninja/genero/audio-latino/';
    console.log(`URL Listado: ${listUrl}\n`);
    
    const response = await axios.get(listUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    console.log('=== ESTRUCTURA DE LISTADO ===\n');
    
    // Buscar artículos de anime
    console.log('Articles con clase .anime, .Anime, article:');
    $('article, .anime, .Anime, .item').each((i, elem) => {
      if (i < 3) {
        const title = $(elem).find('h1, h2, h3, h4, .title, .Title').text().trim();
        const link = $(elem).find('a').first().attr('href');
        const img = $(elem).find('img').first().attr('src');
        console.log(`  ${i+1}. Título: ${title}`);
        console.log(`     Link: ${link}`);
        console.log(`     Img: ${img}`);
        console.log('');
      }
    });
    
    console.log('\n=== SELECTORES POSIBLES ===');
    console.log('Clases únicas encontradas:');
    const classes = new Set();
    $('[class]').each((i, elem) => {
      const classList = $(elem).attr('class').split(' ');
      classList.forEach(c => {
        if (c && (c.includes('anime') || c.includes('item') || c.includes('card'))) {
          classes.add(c);
        }
      });
    });
    Array.from(classes).forEach(c => console.log(`  .${c}`));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

inspectLatinoSite();
