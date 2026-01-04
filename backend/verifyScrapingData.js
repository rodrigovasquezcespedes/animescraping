#!/usr/bin/env node

/**
 * Script para verificar que los datos de scraping se guarden correctamente
 */

const postgres = require('postgres');
require('dotenv').config();

const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'animescraping',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function verifyData() {
  console.log('🔍 VERIFICANDO DATOS DE SCRAPING\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Verificar animes
    const animes = await sql`SELECT COUNT(*) as count FROM anime`;
    console.log(`📺 Total de animes: ${animes[0].count}`);

    // 2. Verificar géneros
    const genres = await sql`SELECT COUNT(*) as count FROM genre`;
    console.log(`🏷️  Total de géneros: ${genres[0].count}`);

    // 3. Verificar status
    const statuses = await sql`SELECT name, COUNT(*) as count FROM anime_status GROUP BY name`;
    console.log(`\n📊 Estados de anime:`);
    statuses.forEach(s => {
      console.log(`   • ${s.name}: ${s.count} registros`);
    });

    // 4. Verificar distribución de ratings
    const withRating = await sql`SELECT COUNT(*) as count FROM anime WHERE rating > 0`;
    const withoutRating = await sql`SELECT COUNT(*) as count FROM anime WHERE rating = 0`;
    console.log(`\n⭐ Ratings:`);
    console.log(`   • Con rating: ${withRating[0].count}`);
    console.log(`   • Sin rating: ${withoutRating[0].count}`);

    // 5. Verificar animes por status
    const animesByStatus = await sql`
      SELECT s.name, COUNT(a.id) as count
      FROM anime_status s
      LEFT JOIN anime a ON a.status_id = s.id
      GROUP BY s.name
    `;
    console.log(`\n📡 Animes por estado:`);
    animesByStatus.forEach(s => {
      const emoji = s.name === 'EN_EMISION' ? '📡' : '✅';
      console.log(`   ${emoji} ${s.name}: ${s.count} animes`);
    });

    // 6. Verificar relaciones anime-género
    const animeGenres = await sql`SELECT COUNT(*) as count FROM anime_genre`;
    console.log(`\n🔗 Relaciones anime-género: ${animeGenres[0].count}`);

    // 7. Verificar episodios
    const episodes = await sql`SELECT COUNT(*) as count FROM episode`;
    console.log(`📼 Total de episodios: ${episodes[0].count}`);

    // 8. Mostrar muestra de animes con todos sus datos
    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`📋 MUESTRA DE ANIMES (últimos 5):\n`);

    const sampleAnimes = await sql`
      SELECT 
        a.id,
        a.title,
        a.rating,
        a.episodes_count,
        s.name as status,
        COUNT(DISTINCT ag.genre_id) as genre_count,
        COUNT(DISTINCT e.id) as episode_count
      FROM anime a
      LEFT JOIN anime_status s ON a.status_id = s.id
      LEFT JOIN anime_genre ag ON a.id = ag.anime_id
      LEFT JOIN episode e ON a.id = e.anime_id
      GROUP BY a.id, a.title, a.rating, a.episodes_count, s.name
      ORDER BY a.id DESC
      LIMIT 5
    `;

    sampleAnimes.forEach((anime, idx) => {
      const statusEmoji = anime.status === 'EN_EMISION' ? '📡' : '✅';
      console.log(`${idx + 1}. ${anime.title.substring(0, 50)}`);
      console.log(`   ${statusEmoji} Status: ${anime.status}`);
      console.log(`   ⭐ Rating: ${anime.rating || 'N/A'}`);
      console.log(`   📺 Episodios: ${anime.episodes_count || 0} (${anime.episode_count} guardados)`);
      console.log(`   🏷️  Géneros: ${anime.genre_count}`);
      console.log('');
    });

    // 9. Verificar géneros específicos de algunos animes
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`🏷️  GÉNEROS DE ALGUNOS ANIMES:\n`);

    const animesWithGenres = await sql`
      SELECT 
        a.title,
        array_agg(g.name) as genres
      FROM anime a
      LEFT JOIN anime_genre ag ON a.id = ag.anime_id
      LEFT JOIN genre g ON ag.genre_id = g.id
      GROUP BY a.id, a.title
      HAVING COUNT(g.id) > 0
      ORDER BY a.id DESC
      LIMIT 3
    `;

    animesWithGenres.forEach((anime, idx) => {
      console.log(`${idx + 1}. ${anime.title.substring(0, 50)}`);
      console.log(`   Géneros: ${anime.genres.join(', ')}`);
      console.log('');
    });

    console.log(`═══════════════════════════════════════════════════`);
    console.log(`\n✅ Verificación completada\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

verifyData();
