#!/usr/bin/env node

const AdvancedAnimeFlvScraper = require('./advancedAnimeFlvScraper');
const { logWithTimestamp } = require('./scrapingUtils');

const args = process.argv.slice(2);

const commands = {
  'help': () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║        ANIME SCRAPING - HERRAMIENTA DE CONTROL        ║
╚════════════════════════════════════════════════════════╝

Comandos disponibles:

  scrape              Scraping de todas las páginas
  scrape --page N     Scraping de una página específica
  scrape --test       Scraping de prueba (primera página)
  help                Mostrar este mensaje

Ejemplos:
  node scraper.js scrape
  node scraper.js scrape --page 5
  node scraper.js scrape --test
    `);
  },

  'scrape': async () => {
    const scraper = new AdvancedAnimeFlvScraper();
    
    if (args[1] === '--page') {
      const page = parseInt(args[2]);
      if (isNaN(page) || page < 1) {
        logWithTimestamp('Página inválida. Use: node scraper.js scrape --page N', 'error');
        return;
      }
      logWithTimestamp(`Iniciando scraping de página ${page}...`, 'scrape');
      await scraper.scrapeSinglePage(page);
    } else if (args[1] === '--test') {
      logWithTimestamp('Iniciando scraping de prueba...', 'scrape');
      await scraper.scrapeSinglePage(1);
    } else {
      logWithTimestamp('Iniciando scraping completo...', 'scrape');
      await scraper.startFullScraping();
    }
  }
};

async function main() {
  if (args.length === 0 || args[0] === 'help') {
    commands.help();
    return;
  }

  const command = args[0];
  
  if (commands[command]) {
    await commands[command]();
  } else {
    logWithTimestamp(`Comando desconocido: ${command}`, 'error');
    console.log('Use "node scraper.js help" para ver los comandos disponibles\n');
  }
}

main().catch(error => {
  logWithTimestamp(`Error fatal: ${error.message}`, 'error');
  process.exit(1);
});
