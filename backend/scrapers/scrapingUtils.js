/**
 * Utilidades para scraping de animes
 */

/**
 * Limpiar y validar título de anime
 */
function cleanTitle(title) {
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 255);
}

/**
 * Validar URL
 */
function isValidUrl(url) {
  try {
    new URL(url.startsWith('http') ? url : 'http://www3.animeflv.net' + url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extraer número de página de URL
 */
function extractPageNumber(url) {
  const match = url.match(/page=(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Convertir estado de anime
 */
function normalizeStatus(statusText) {
  if (!statusText) return 'FINALIZADO';
  
  const text = statusText.toLowerCase();
  if (text.includes('emision') || text.includes('emitiendo') || text.includes('en emisión')) {
    return 'EN_EMISION';
  }
  return 'FINALIZADO';
}

/**
 * Validar rating
 */
function validateRating(rating) {
  const num = parseFloat(rating);
  if (isNaN(num)) return 0;
  if (num < 0) return 0;
  if (num > 10) return 10;
  return parseFloat(num.toFixed(1));
}

/**
 * Obtener información de error amigable
 */
function getErrorMessage(error) {
  if (error.code === 'ECONNREFUSED') {
    return 'Conexión rechazada';
  }
  if (error.code === 'ETIMEDOUT') {
    return 'Tiempo de conexión agotado';
  }
  if (error.code === 'ENOTFOUND') {
    return 'Servidor no encontrado';
  }
  if (error.response?.status === 429) {
    return 'Demasiadas solicitudes (rate limit)';
  }
  if (error.response?.status === 403) {
    return 'Acceso denegado';
  }
  if (error.response?.status === 404) {
    return 'Página no encontrada';
  }
  return error.message || 'Error desconocido';
}

/**
 * Formato de log con timestamp
 */
function logWithTimestamp(message, type = 'info') {
  const timestamp = new Date().toLocaleString('es-ES');
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    debug: '🔍',
    scrape: '🕷️ '
  };
  
  console.log(`${icons[type] || '•'} [${timestamp}] ${message}`);
}

module.exports = {
  cleanTitle,
  isValidUrl,
  extractPageNumber,
  normalizeStatus,
  validateRating,
  getErrorMessage,
  logWithTimestamp
};
