// Adaptación mínima para Enact
const API_URL = 'http://192.168.1.157:5000/api';

const getSessionId = () => {
	let sessionId = localStorage.getItem('animeSessionId');
	if (!sessionId) {
		sessionId = Math.random().toString(36).substring(2) + Date.now();
		localStorage.setItem('animeSessionId', sessionId);
	}
	return sessionId;
};

const animeService = {
	getAllAnime: async (limit = 10, offset = 0) => {
		const response = await fetch(`${API_URL}/anime?limit=${limit}&offset=${offset}`);
		if (!response.ok) throw new Error('Error fetching anime');
		return await response.json();
	},
	getFavorites: async () => {
		const sessionId = getSessionId();
		const response = await fetch(`${API_URL}/anime/favorite/list/${sessionId}`);
		if (!response.ok) throw new Error('Error fetching favorites');
		return await response.json();
	},
	addFavorite: async (animeId) => {
		const sessionId = getSessionId();
		const response = await fetch(`${API_URL}/anime/favorite/add`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId, animeId })
		});
		if (!response.ok) throw new Error('Error adding favorite');
		return await response.json();
	},
	removeFavorite: async (animeId) => {
		const sessionId = getSessionId();
		const response = await fetch(`${API_URL}/anime/favorite/remove`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId, animeId })
		});
		if (!response.ok) throw new Error('Error removing favorite');
		return await response.json();
	}
};

export default animeService;
