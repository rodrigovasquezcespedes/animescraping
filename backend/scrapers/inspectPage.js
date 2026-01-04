#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function inspect() {
  try {
    console.log('🔍 Inspeccionando página de anime...\n');
    
    // Inspeccionar una página de detalle
    const url = 'https://www3.animeflv.net/anime/yuushakei-ni-shosu-choubatsu-yuusha-9004tai-keimu-kiroku';
    console.log(`URL: ${url}\n`);
    
    const response = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    console.log('=== TÍTULO ===');
    console.log($('h1.Title, h1, .anime-title').text().trim());
    
    console.log('\n=== RATING ===');
    console.log($('.vote_overview span, .score, #votes_prmd, .rating').text().trim());
    
    console.log('\n=== DESCRIPCIÓN ===');
    console.log($('.Description, .description, div.Description p, .synopsis').first().text().trim().substring(0, 200));
    
    console.log('\n=== INFORMACIÓN ===');
    $('.AnmStts, .info-item, .info p').each((i, elem) => {
      console.log(`  ${i+1}. ${$(elem).text().trim().substring(0, 100)}`);
    });
    
    console.log('\n=== BÚSQUEDA DE GÉNEROS (Nvgnrs) ===');
    $('.Nvgnrs a, nav.Nvgnrs a').each((i, elem) => {
      const text = $(elem).text().trim();
      const href = $(elem).attr('href');
      console.log(`  ${i+1}. ${text} -> ${href}`);
    });
    
    console.log('\n=== BÚSQUEDA DE GÉNEROS (enlaces a /genre/) ===');
    $('a[href*="/genre/"]').each((i, elem) => {
      const text = $(elem).text().trim();
      const href = $(elem).attr('href');
      if (text) {
        console.log(`  ${i+1}. ${text} -> ${href}`);
      }
    });
    
    console.log('\n=== STATUS ===');
    $('.AnmStts').each((i, elem) => {
      const text = $(elem).text();
      if (text.includes('Estado')) {
        console.log(text.trim());
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspect();
