// Utilidades comunes para el backend
const postgres = require('postgres');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSqlConnection() {
  return postgres({
    host: 'localhost',
    port: 5432,
    database: 'animescraping',
    username: 'postgres',
    password: 'postgres',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  });
}

module.exports = { sleep, getSqlConnection };