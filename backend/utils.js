// Utilidades comunes para el backend
const postgres = require('postgres');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSqlConnection() {
  return postgres({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME || 'animescraping',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: process.env.DB_MAX ? parseInt(process.env.DB_MAX) : 10,
    idle_timeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 20,
    connect_timeout: process.env.DB_CONNECT_TIMEOUT ? parseInt(process.env.DB_CONNECT_TIMEOUT) : 10
  });
}

module.exports = { sleep, getSqlConnection };