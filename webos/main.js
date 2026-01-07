
// --- Gestión de favoritos en localStorage ---
function getFavorites() {
  try {
    const favs = localStorage.getItem('favorites');
    return favs ? JSON.parse(favs) : [];
  } catch (e) {
    return [];
  }
}

function setFavorites(favs) {
  try {
    localStorage.setItem('favorites', JSON.stringify(favs));
  } catch (e) {}
}
// Permite mostrar/ocultar los links de servidores de un capítulo en el modal
function toggleServers(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
  }
}
window.toggleServers = toggleServers;
// Renderiza la lista de animes en la galería principal
function renderAnimeList(animes) {
  animeList.innerHTML = '';
  if (!Array.isArray(animes) || animes.length === 0) {
    animeList.innerHTML = '<p style="color:#b0b8c8;text-align:center;padding:40px 0;">No hay animes para mostrar.</p>';
    return;
  }
  animes.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <div class="anime-img-container" style="position:relative;width:100%;height:280px;">
        <img src="${anime.image_url}" alt="${anime.title}" class="anime-img" onerror="this.style.display='none'">
      </div>
      <div class="anime-info" style="padding:16px;display:flex;flex-direction:column;">
        <h3 style="color:var(--text-primary);margin:0 0 12px 0;font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.3;">${anime.title}</h3>
        ${anime.rating ? `<p class="rating" style="color:#ffa500;font-weight:bold;">⭐ ${anime.rating}/10</p>` : ''}
        ${anime.episodes_count ? `<p class="episodes" style="color:var(--text-primary);">📺 ${anime.episodes_count} episodios</p>` : ''}
        ${anime.description ? `<p class="description" style="color:#b0b8c8;font-size:12px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${anime.description.substring(0, 100)}...</p>` : ''}
      </div>
    `;
    card.onclick = () => showModal(anime);
    animeList.appendChild(card);
  });
}
const BASE_API_URL = 'http://192.168.1.157:5000/api/anime';
let currentCategory = 'ANIME';

const animeList = document.getElementById('anime-list');
const favoritesList = document.getElementById('favorites-list');
const modal = document.getElementById('modal');
const showFavoritesBtn = document.getElementById('show-favorites');

async function showModal(anime) {
  try {
    console.log('[showModal] anime recibido:', anime);
    if (!anime || !anime.id) {
      modal.innerHTML = '<div class="modal-content"><p style="color:#ff6b6b;">Error: El anime no tiene un ID válido.</p></div>';
      modal.style.display = 'flex';
      return;
    }
    // Siempre obtener datos actualizados del backend por ID
    const res = await fetch(`${BASE_API_URL}/${anime.id}`);
    console.log('[showModal] URL fetch:', `${BASE_API_URL}/${anime.id}`);
    const result = await res.json();
    console.log('[showModal] Respuesta backend:', result);
    const data = result.data || result || {};
    if (!data || !data.id) {
      modal.innerHTML = '<div class="modal-content"><p style="color:#ff6b6b;">No se encontraron detalles para este anime.</p></div>';
      modal.style.display = 'flex';
      return;
    }
    const episodesArr = data.episodes || [];
      let episodesHtml = '';
      if (Array.isArray(episodesArr) && episodesArr.length > 0) {
        const useScroll = episodesArr.length > 3;
        episodesHtml = `<div class="modal-episodes-box">`;
        episodesHtml += useScroll ? `<div class="modal-episodes-scroll">` : `<div class="modal-episodes-block">`;
        episodesArr.forEach((ep, i) => {
          const num = ep.episode_number || ep.number || ep.numero || ep.num || (i+1);
          const title = ep.title || ep.name || ep.titulo || ep.título || `Episodio ${num}`;
          const epId = `ep-${i}`;
          episodesHtml += `<div class="modal-episode-group">
            <div class="modal-episode-title" style="cursor:pointer;user-select:none;" onclick="toggleServers('${epId}')"><strong>Cap. ${num}:</strong> ${title} <span style='font-size:13px;color:#7ac6ff;'>&#9660;</span></div>
            <div class="modal-servers-row" id="${epId}" style="display:none;">`;
          if (Array.isArray(ep.servers) && ep.servers.length > 0) {
            ep.servers.forEach((srv, idx) => {
              episodesHtml += `<button class="server-button" tabindex="0" onclick="window.open('${srv.url}','_blank')">${srv.name || 'Servidor ' + (idx+1)}</button>`;
            });
          } else {
            episodesHtml += `<span style=\"color:#b0b8c8;font-size:13px;\">Sin servidores disponibles</span>`;
          }
          episodesHtml += `</div></div>`;
        });
        episodesHtml += `</div></div>`;
      }

    // Permite mostrar/ocultar los links de servidores de un capítulo en el modal
    function toggleServers(id) {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
      }
    }
    window.toggleServers = toggleServers;
    // Buscar la mejor descripción disponible
    let desc = data.description || data.sinopsis || data.summary || data.synopsis || data.resumen || '';
    if (!desc) desc = '<span style="color:#b0b8c8;font-style:italic;">Sin descripción disponible.</span>';
    // Determinar si es favorito
    const isFav = getFavorites().some(f => f.id === data.id);
        modal.innerHTML = `<div class="modal-content">
          <div class="modal-main-row">
            <div class="modal-img-col" style="position:relative;">
              <img src="${data.image_url}" alt="${data.title}" class="anime-img-modal" onerror="this.style.display='none'">
              <button id="modal-fav-btn" class="favorite-btn${isFav ? ' active' : ''}" title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" tabindex="0" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.7);border:2px solid #fff;width:54px;height:54px;font-size:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:2;color:#ff6b6b;box-shadow:0 2px 12px #0006;outline:none;transition:box-shadow 0.2s;">
                <span style="pointer-events:none;">${isFav ? '❤️' : '🤍'}</span>
              </button>
            </div>
            <div class="modal-desc-col">
              <div style='display: flex; align-items: center; justify-content: space-between; gap: 1rem;'>
                <h2 style='margin-bottom: 0;'>${data.title}</h2>
                <button class="modal-close-btn" aria-label="Cerrar" tabindex="0" onclick="document.getElementById('modal').style.display='none';document.body.style.overflow='';">Cerrar</button>
              </div>
              <p>${desc}</p>
              <div class="modal-episodes-row">
                ${episodesHtml}
              </div>
            </div>
          </div>
        </div>`;
    // Lógica de favoritos en el modal
    const favBtn = document.getElementById('modal-fav-btn');
    favBtn.onclick = (e) => {
      e.stopPropagation();
      const favs = getFavorites();
      if (favs.some(f => f.id === data.id)) {
        removeFavorite(data.id);
        favBtn.classList.remove('active');
        favBtn.querySelector('span').textContent = '🤍';
        favBtn.title = 'Agregar a favoritos';
      } else {
        addFavorite(data);
        favBtn.classList.add('active');
        favBtn.querySelector('span').textContent = '❤️';
        favBtn.title = 'Quitar de favoritos';
      }
    };
    // Accesibilidad: activar con Enter/Espacio y foco visual
    favBtn.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        favBtn.click();
      }
    };
    favBtn.onfocus = () => {
      favBtn.style.boxShadow = '0 0 0 4px #7ac6ff, 0 2px 12px #0006';
    };
    favBtn.onblur = () => {
      favBtn.style.boxShadow = '0 2px 12px #0006';
    };
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('[showModal] Error:', e);
    modal.innerHTML = `<div class="modal-content"><p style="color:#ff6b6b;">Error al cargar detalles del anime.<br>${e && e.message ? e.message : ''}</p></div>`;
    modal.style.display = 'flex';
  }
}

function renderFavorites() {
  favoritesList.innerHTML = '';
  const favs = getFavorites();
  favs.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.setAttribute('tabindex', '0');
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
  if (e.target === modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

// Cerrar modal y restaurar scroll
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.body.style.overflow = '';
}


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
  animeList.style.display = 'grid';
  favoritesList.style.display = 'none';
  showFavoritesBtn.textContent = 'Favoritos';
}

document.getElementById('btn-anime').onclick = function() { setActiveMenu('ANIME'); };
document.getElementById('btn-dorama').onclick = function() { setActiveMenu('DORAMA'); };
document.getElementById('btn-peliculas').onclick = function() { setActiveMenu('PELICULA'); };
document.getElementById('btn-series').onclick = function() { setActiveMenu('SERIE'); };

loadAnimes();
