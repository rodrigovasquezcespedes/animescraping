const postgres = require('postgres');

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'animescraping',
  username: 'postgres',
  password: 'postgres',
});

async function checkEpisodes() {
  console.log('📊 Verificando episodios guardados...\n');
  
  const result = await sql`
    SELECT 
      a.title, 
      a.audio_type,
      COUNT(e.id)::int as eps 
    FROM anime a 
    LEFT JOIN episode e ON a.id = e.anime_id 
    GROUP BY a.id, a.title, a.audio_type
    HAVING COUNT(e.id) > 0 
    ORDER BY a.id DESC 
    LIMIT 10
  `;
  
  if (result.length === 0) {
    console.log('❌ No hay animes con episodios guardados todavía\n');
  } else {
    console.log(`✅ ${result.length} animes con episodios:\n`);
    result.forEach(r => {
      const emoji = r.audio_type === 'LATINO' ? '🇲🇽' : '📝';
      console.log(`${emoji} ${r.title.substring(0, 50).padEnd(50)} - ${r.eps} eps`);
    });
    console.log('');
  }
  
  await sql.end();
  process.exit(0);
}

checkEpisodes().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
