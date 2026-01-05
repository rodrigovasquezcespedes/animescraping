const BASE_API_URL = 'http://192.168.1.157:5000/api/anime';
let currentCategory = 'ANIME';

const animeList = document.getElementById('anime-list');
const favoritesList = document.getElementById('favorites-list');
const modal = document.getElementById('modal');
const showFavoritesBtn = document.getElementById('show-favorites');

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function setFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs));
}


function renderAnimeList(animes) {
  animeList.innerHTML = '';
  animes.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.style.position = 'relative';
    card.innerHTML = `
      <div class="anime-img-container" style="position:relative;width:100%;height:280px;">
        <img src="${anime.image_url}" alt="${anime.title}" class="anime-img" onerror="this.style.display='none'">
        <button class="favorite-btn" title="Agregar a favoritos" style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.5);border:none;font-size:16px;cursor:pointer;padding:4px;border-radius:50%;z-index:10;backdrop-filter:blur(4px);width:28px;height:28px;display:flex;align-items:center;justify-content:center;">🤍</button>
      </div>
      <div class="anime-info" style="padding:16px;display:flex;flex-direction:column;">
        <h3 style="color:var(--text-primary);margin:0 0 12px 0;font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.3;">${anime.title}</h3>
        ${anime.rating ? `<p class="rating" style="color:#ffa500;font-weight:bold;">⭐ ${anime.rating}/10</p>` : ''}
        ${anime.episodes_count ? `<p class="episodes" style="color:var(--text-primary);">📺 ${anime.episodes_count} episodios</p>` : ''}
        ${anime.description ? `<p class="description" style="color:#b0b8c8;font-size:12px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${anime.description.substring(0, 100)}...</p>` : ''}
      </div>
    `;
    card.querySelector('.favorite-btn').onclick = (e) => {
      e.stopPropagation();
      addFavorite(anime);
    };
    card.onclick = () => showModal(anime);
    animeList.appendChild(card);
  });
}


function renderFavorites() {
  const favs = getFavorites();
  favoritesList.innerHTML = '';
  favs.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.style.position = 'relative';
    card.innerHTML = `
      <div class="anime-img-container" style="position:relative;width:100%;height:280px;">
        <img src="${anime.image_url}" alt="${anime.title}" class="anime-img" onerror="this.style.display='none'">
        <button class="favorite-btn active" title="Quitar de favoritos" style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.5);border:none;font-size:16px;cursor:pointer;padding:4px;border-radius:50%;z-index:10;backdrop-filter:blur(4px);width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:#ff6b6b;">❤️</button>
      </div>
      <div class="anime-info" style="padding:16px;display:flex;flex-direction:column;">
        <h3 style="color:var(--text-primary);margin:0 0 12px 0;font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.3;">${anime.title}</h3>
        ${anime.rating ? `<p class="rating" style="color:#ffa500;font-weight:bold;">⭐ ${anime.rating}/10</p>` : ''}
        ${anime.episodes_count ? `<p class="episodes" style="color:var(--text-primary);">📺 ${anime.episodes_count} episodios</p>` : ''}
        ${anime.description ? `<p class="description" style="color:#b0b8c8;font-size:12px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${anime.description.substring(0, 100)}...</p>` : ''}
      </div>
    `;
    card.querySelector('.favorite-btn').onclick = (e) => {
      e.stopPropagation();
      removeFavorite(anime.id);
    };
    card.onclick = () => showModal(anime);
    favoritesList.appendChild(card);
  });
}

function addFavorite(anime) {
  const favs = getFavorites();
  if (!favs.find(a => a.id === anime.id)) {
    favs.push(anime);
    setFavorites(favs);
    alert('Agregado a favoritos');
  }
}

function removeFavorite(id) {
  let favs = getFavorites();
  favs = favs.filter(a => a.id !== id);
  setFavorites(favs);
  renderFavorites();
}

function showModal(anime) {
  modal.innerHTML = `<div class="modal-content">
    <img src="${anime.image_url}" alt="${anime.title}" class="anime-img-modal" onerror="this.style.display='none'">
    <h2>${anime.title}</h2>
    <p>${anime.description || ''}</p>
    <button onclick="document.getElementById('modal').style.display='none'">Cerrar</button>
  </div>`;
  modal.style.display = 'flex';
}

showFavoritesBtn.onclick = () => {
  if (favoritesList.style.display === 'none') {
    renderFavorites();
    favoritesList.style.display = 'flex';
    animeList.style.display = 'none';
    showFavoritesBtn.textContent = 'Ver todos';
  } else {
    favoritesList.style.display = 'none';
    animeList.style.display = 'flex';
    showFavoritesBtn.textContent = 'Favoritos';
  }
};

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = 'none';
};


async function loadAnimes() {
  animeList.innerHTML = '<p>Cargando...</p>';
  try {
    let url = BASE_API_URL;
    if (currentCategory === 'DORAMA') {
      url += '?category=DORAMA';
    } else if (currentCategory === 'PELICULA') {
      url += '?category=PELICULA';
    } else if (currentCategory === 'SERIE') {
      url += '?category=SERIE';
    } else {
      url += '?category=ANIME';
    }
    const res = await fetch(url);
    let data = await res.json();
    // Asegurarse de que data es un array
    if (!Array.isArray(data)) {
      if (data && Array.isArray(data.results)) {
        data = data.results;
      } else if (data && typeof data === 'object') {
        data = Object.values(data);
      } else {
        data = [];
      }
    }
    renderAnimeList(data);
  } catch (e) {
    animeList.innerHTML = '<p>Error al cargar animes</p>';
  }
}

// Botones de menú

function setActiveMenu(category) {
  currentCategory = category;
  const btns = ['btn-anime', 'btn-dorama', 'btn-peliculas', 'btn-series'];
  btns.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });
  if (category === 'ANIME') document.getElementById('btn-anime').classList.add('active');
  if (category === 'DORAMA') document.getElementById('btn-dorama').classList.add('active');
  if (category === 'PELICULA') document.getElementById('btn-peliculas').classList.add('active');
  if (category === 'SERIE') document.getElementById('btn-series').classList.add('active');
  loadAnimes();
  animeList.style.display = 'flex';
  favoritesList.style.display = 'none';
  showFavoritesBtn.textContent = 'Favoritos';
}

document.getElementById('btn-anime').onclick = function() { setActiveMenu('ANIME'); };
document.getElementById('btn-dorama').onclick = function() { setActiveMenu('DORAMA'); };
document.getElementById('btn-peliculas').onclick = function() { setActiveMenu('PELICULA'); };
document.getElementById('btn-series').onclick = function() { setActiveMenu('SERIE'); };

loadAnimes();
