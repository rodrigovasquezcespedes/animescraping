#!/usr/bin/env node

/**
 * Script para inicializar/verificar el schema de la base de datos
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'animescraping',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initDatabase() {
  console.log('🔧 INICIALIZANDO BASE DE DATOS\n');
  
  try {
    // Verificar si las tablas existen
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`📋 Tablas existentes: ${tables.length}`);
    tables.forEach(t => console.log(`   • ${t.table_name}`));
    console.log('');
    
    const requiredTables = ['anime', 'anime_status', 'genre', 'anime_genre', 'episode'];
    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`❌ Faltan tablas: ${missingTables.join(', ')}\n`);
      console.log('📝 Aplicando schema desde db/init.sql...\n');
      
      // Leer y ejecutar el script SQL
      const sqlPath = path.join(__dirname, 'db', 'init.sql');
      const sqlScript = fs.readFileSync(sqlPath, 'utf8');
      
      // Ejecutar el script completo
      await sql.unsafe(sqlScript);
      
      console.log('✅ Schema aplicado correctamente\n');
      
      // Verificar nuevamente
      const newTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log(`📋 Tablas después de init: ${newTables.length}`);
      newTables.forEach(t => console.log(`   • ${t.table_name}`));
      
    } else {
      console.log('✅ Todas las tablas necesarias existen\n');
    }
    
    // Insertar estados predeterminados
    console.log('📊 Verificando estados...');
    await sql`
      INSERT INTO anime_status (name) VALUES ('EN_EMISION')
      ON CONFLICT (name) DO NOTHING
    `;
    await sql`
      INSERT INTO anime_status (name) VALUES ('FINALIZADO')
      ON CONFLICT (name) DO NOTHING
    `;
    
    const statuses = await sql`SELECT * FROM anime_status`;
    console.log(`   ✅ Estados configurados: ${statuses.length}`);
    statuses.forEach(s => console.log(`      • ${s.name}`));
    
    console.log('\n✅ Base de datos lista para usar\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

initDatabase();
