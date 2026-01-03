const express = require('express');
const AnimeController = require('../controllers/AnimeController');

const router = express.Router();

// Anime
router.get('/', AnimeController.getAll.bind(AnimeController));
router.get('/:id', AnimeController.getById.bind(AnimeController));

// Favoritos anónimos
router.post('/favorite/add', AnimeController.addAnonymousFavorite.bind(AnimeController));
router.post('/favorite/remove', AnimeController.removeAnonymousFavorite.bind(AnimeController));
router.get('/favorite/list/:sessionId', AnimeController.getAnonymousFavorites.bind(AnimeController));
router.get('/favorite/check/:sessionId/:animeId', AnimeController.isAnonymousFavorite.bind(AnimeController));

module.exports = router;
