const postgres = require('postgres');

const sql = postgres({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

class AnimeModel {
  async getAll(limit = 10, offset = 0) {
    return await sql`SELECT * FROM anime LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
  }

  async getById(id) {
    const result = await sql`SELECT * FROM anime WHERE id = ${id}`;
    return result[0] || null;
  }

  // Favoritos anónimos
  async addAnonymousFavorite(sessionId, animeId) {
    await sql`
      INSERT INTO anonymous_session (id) VALUES (${sessionId})
      ON CONFLICT (id) DO NOTHING
    `;
    return await sql`
      INSERT INTO anonymous_favorite (session_id, anime_id)
      VALUES (${sessionId}, ${animeId})
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
  }

  async removeAnonymousFavorite(sessionId, animeId) {
    return await sql`
      DELETE FROM anonymous_favorite
      WHERE session_id = ${sessionId} AND anime_id = ${animeId}
    `;
  }

  async getAnonymousFavorites(sessionId) {
    return await sql`
      SELECT a.* FROM anime a
      INNER JOIN anonymous_favorite af ON a.id = af.anime_id
      WHERE af.session_id = ${sessionId}
    `;
  }

  async isAnonymousFavorite(sessionId, animeId) {
    const result = await sql`
      SELECT 1 FROM anonymous_favorite
      WHERE session_id = ${sessionId} AND anime_id = ${animeId}
    `;
    return result.length > 0;
  }
}

module.exports = new AnimeModel();

