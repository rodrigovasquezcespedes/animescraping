const AnimeModel = require('../models/AnimeModel');

class AnimeController {
  async getAll(req, res) {
    try {
      const { limit = 100, offset = 0, audioType, category = 'ANIME', genre } = req.query;
      const data = await AnimeModel.getAll(limit, offset, audioType, category, genre);
      res.json(data || []);
    } catch (err) {
      console.error('Error getAll:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await AnimeModel.getById(id);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Favoritos anónimos
  async addAnonymousFavorite(req, res) {
    try {
      const { sessionId, animeId } = req.body;
      const result = await AnimeModel.addAnonymousFavorite(sessionId, animeId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async removeAnonymousFavorite(req, res) {
    try {
      const { sessionId, animeId } = req.body;
      await AnimeModel.removeAnonymousFavorite(sessionId, animeId);
      res.json({ success: true, message: 'Favorito eliminado' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAnonymousFavorites(req, res) {
    try {
      const { sessionId } = req.params;
      const data = await AnimeModel.getAnonymousFavorites(sessionId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async isAnonymousFavorite(req, res) {
    try {
      const { sessionId, animeId } = req.params;
      const isFavorite = await AnimeModel.isAnonymousFavorite(sessionId, animeId);
      res.json({ success: true, isFavorite });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Obtener géneros de doramas
  async getDoramaGenres(req, res) {
    try {
      const genres = await AnimeModel.getDoramaGenres();
      res.json({ success: true, data: genres });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AnimeController();
