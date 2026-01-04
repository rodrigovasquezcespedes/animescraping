const postgres = require('postgres');

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'animescraping',
  username: 'postgres',
  password: 'postgres',
});

class AnimeModel {
  async getAll(limit = 10, offset = 0, audioType = null) {
    if (audioType) {
      return await sql`
        SELECT * FROM anime 
        WHERE audio_type = ${audioType}
        ORDER BY id DESC
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;
    }
    return await sql`
      SELECT * FROM anime 
      ORDER BY id DESC
      LIMIT ${parseInt(limit)} 
      OFFSET ${parseInt(offset)}
    `;
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

  // ============== MÉTODOS PARA SCRAPING ==============

  /**
   * Crear o actualizar un anime
   */
  async upsertAnime(anime) {
    const { title, description, imageUrl, rating, episodesCount, statusId } = anime;
    
    const result = await sql`
      INSERT INTO anime (title, description, image_url, rating, episodes_count, status_id)
      VALUES (${title}, ${description}, ${imageUrl}, ${rating}, ${episodesCount}, ${statusId})
      ON CONFLICT (title) DO UPDATE
      SET 
        description = ${description},
        image_url = ${imageUrl},
        rating = ${rating},
        episodes_count = ${episodesCount},
        status_id = ${statusId},
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    return result[0]?.id;
  }

  /**
   * Obtener o crear estado
   */
  async ensureStatus(statusName) {
    const result = await sql`
      INSERT INTO anime_status (name) 
      VALUES (${statusName})
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `;
    
    if (result.length > 0) {
      return result[0].id;
    }
    
    const existing = await sql`SELECT id FROM anime_status WHERE name = ${statusName}`;
    return existing[0]?.id;
  }

  /**
   * Obtener o crear género
   */
  async ensureGenre(genreName) {
    const result = await sql`
      INSERT INTO genre (name)
      VALUES (${genreName})
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `;
    
    if (result.length > 0) {
      return result[0].id;
    }
    
    const existing = await sql`SELECT id FROM genre WHERE name = ${genreName}`;
    return existing[0]?.id;
  }

  /**
   * Asociar género a anime
   */
  async addGenreToAnime(animeId, genreId) {
    await sql`
      INSERT INTO anime_genre (anime_id, genre_id)
      VALUES (${animeId}, ${genreId})
      ON CONFLICT DO NOTHING
    `;
  }

  /**
   * Insertar episodio
   */
  async upsertEpisode(episode) {
    const { animeId, episodeNumber, title, url } = episode;
    
    await sql`
      INSERT INTO episode (anime_id, episode_number, title, url)
      VALUES (${animeId}, ${episodeNumber}, ${title}, ${url})
      ON CONFLICT (anime_id, episode_number) DO UPDATE
      SET 
        title = ${title},
        url = ${url}
    `;
  }

  /**
   * Obtener total de animes en BD
   */
  async getTotalCount() {
    const result = await sql`SELECT COUNT(*) as count FROM anime`;
    return result[0]?.count || 0;
  }

  /**
   * Obtener total de géneros
   */
  async getTotalGenres() {
    const result = await sql`SELECT COUNT(*) as count FROM genre`;
    return result[0]?.count || 0;
  }

  /**
   * Obtener total de episodios
   */
  async getTotalEpisodes() {
    const result = await sql`SELECT COUNT(*) as count FROM episode`;
    return result[0]?.count || 0;
  }

  /**
   * Limpiar todos los datos (solo para desarrollo)
   */
  async truncateAllData() {
    try {
      await sql`TRUNCATE TABLE anonymous_favorite CASCADE`;
      await sql`TRUNCATE TABLE favorite CASCADE`;
      await sql`TRUNCATE TABLE anonymous_session CASCADE`;
      await sql`TRUNCATE TABLE app_user CASCADE`;
      await sql`TRUNCATE TABLE episode CASCADE`;
      await sql`TRUNCATE TABLE anime_genre CASCADE`;
      await sql`TRUNCATE TABLE anime CASCADE`;
      await sql`TRUNCATE TABLE genre CASCADE`;
      await sql`TRUNCATE TABLE anime_status CASCADE`;
    } catch (error) {
      console.error('Error truncating data:', error);
      throw error;
    }
  }
}

module.exports = new AnimeModel();

