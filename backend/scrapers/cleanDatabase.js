const postgres = require('postgres');

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'animescraping',
  username: 'postgres',
  password: 'postgres',
});

async function cleanDatabase() {
  console.log('🗑️  Limpiando base de datos...\n');
  
  try {
    // Eliminar en orden por dependencias
    await sql`DELETE FROM episode`;
    console.log('✅ Episodios eliminados');
    
    await sql`DELETE FROM anime_genre`;
    console.log('✅ Relaciones anime-género eliminadas');
    
    await sql`DELETE FROM anime`;
    console.log('✅ Animes eliminados');
    
    await sql`DELETE FROM genre`;
    console.log('✅ Géneros eliminados');
    
    await sql`DELETE FROM anime_status`;
    console.log('✅ Estados eliminados');
    
    // Reiniciar secuencias (solo las que existen)
    try {
      await sql`ALTER SEQUENCE anime_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE genre_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE anime_status_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE episode_id_seq RESTART WITH 1`;
      console.log('✅ Secuencias reiniciadas');
    } catch (err) {
      console.log('⚠️  Secuencias no reiniciadas (puede ser normal)');
    }
    
    console.log('\n✨ Base de datos limpiada exitosamente\n');
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error.message);
    process.exit(1);
  }
  
  await sql.end();
  process.exit(0);
}

cleanDatabase();
