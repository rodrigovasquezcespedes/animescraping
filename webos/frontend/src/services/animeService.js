const API_URL = 'http://localhost:5000/api';

// Generar UUID v4
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Obtener o crear sessionId
export const getSessionId = () => {
  let sessionId = localStorage.getItem('animeSessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('animeSessionId', sessionId);
  }
  return sessionId;
};

export const animeService = {
  getAllAnime: async (limit = 10, offset = 0) => {
    try {
      const response = await fetch(`${API_URL}/anime?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Error fetching anime');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },

  getAnimeById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/anime/${id}`);
      if (!response.ok) throw new Error('Error fetching anime');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },

  // Favoritos anónimos
  addFavorite: async (animeId) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`${API_URL}/anime/favorite/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, animeId })
      });
      if (!response.ok) throw new Error('Error adding favorite');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },

  removeFavorite: async (animeId) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`${API_URL}/anime/favorite/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, animeId })
      });
      if (!response.ok) throw new Error('Error removing favorite');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },

  getFavorites: async () => {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`${API_URL}/anime/favorite/list/${sessionId}`);
      if (!response.ok) throw new Error('Error fetching favorites');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },

  isFavorite: async (animeId) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`${API_URL}/anime/favorite/check/${sessionId}/${animeId}`);
      if (!response.ok) throw new Error('Error checking favorite');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
};
