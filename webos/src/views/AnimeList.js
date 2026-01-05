
import kind from '@enact/core/kind';
import Scroller from '@enact/sandstone/Scroller';
import Image from '@enact/sandstone/Image';
import Button from '@enact/sandstone/Button';
import Spinner from '@enact/sandstone/Spinner';
import AnimeModal from './AnimeModal';
import animeService from '../services/animeService';
import css from './AnimeList.module.less';

const AnimeCard = kind({
	name: 'AnimeCard',
	styles: {
		css,
		className: 'animeCard'
	},
	props: ['anime', 'isFavorite', 'onToggleFavorite', 'onSelect'],
	render: ({anime, isFavorite, onToggleFavorite, onSelect, ...rest}) => (
		<div {...rest} className={css.card} onClick={() => onSelect(anime)}>
			<Image src={anime.image_url} className={css.cover} />
			<div className={css.info}>
				<h3>{anime.title}</h3>
				{anime.rating && <div>⭐ {anime.rating}/10</div>}
				{anime.episodes_count && <div>📺 {anime.episodes_count} episodios</div>}
				<Button small iconBefore={isFavorite ? 'heart' : 'heart'} onClick={(e) => {e.stopPropagation(); onToggleFavorite(anime.id);}}>
					{isFavorite ? '❤️' : '🤍'}
				</Button>
			</div>
		</div>
	)
});

const AnimeList = kind({
	name: 'AnimeList',
	styles: {
		css,
		className: 'animeList'
	},
	handlers: {
		onSelectAnime: (ev, {setState, anime}) => setState({selectedAnime: anime}),
		onCloseModal: (ev, {setState}) => setState({selectedAnime: null}),
		onToggleFavorite: async (ev, {setState, favorites, animeId}) => {
			let newFavorites = new Set(favorites);
			try {
				if (favorites.has(animeId)) {
					await animeService.removeFavorite(animeId);
					newFavorites.delete(animeId);
				} else {
					await animeService.addFavorite(animeId);
					newFavorites.add(animeId);
				}
			} catch {}
			setState({favorites: newFavorites});
		}
	},
	getInitialState () {
		return {
			animes: [],
			favorites: new Set(),
			loading: true,
			error: null,
			selectedAnime: null
		};
	},
	create: function () {
		this.fetchData();
	},
	fetchData: function () {
		this.setState({loading: true});
		Promise.all([
			animeService.getAllAnime(1000, 0),
			animeService.getFavorites()
		]).then(([result, favs]) => {
			this.setState({
				animes: result.data || result,
				favorites: new Set((favs.data || favs).map(a => a.id)),
				error: null,
				loading: false
			});
		}).catch(() => {
			this.setState({error: 'Error cargando datos', loading: false});
		});
	},
	render: (props, state) => {
		state = state || {};
		const {
			animes = [],
			favorites = new Set(),
			loading = true,
			error = null,
			selectedAnime = null
		} = state;
		if (loading) return <Spinner center>Cargando...</Spinner>;
		if (error) return <div className={css.error}>{error}</div>;
		return (
			<>
				<Scroller>
					<div className={css.gallery}>
						{animes.length === 0 ? (
							<div className={css.noAnime}>No hay resultados para esta categoría o filtro.</div>
						) : (
							animes.map(anime => (
								<AnimeCard key={anime.id} anime={anime} isFavorite={favorites.has(anime.id)} onToggleFavorite={ev => props.onToggleFavorite(ev, {favorites, animeId: anime.id})} onSelect={ev => props.onSelectAnime(ev, {anime})} />
							))
						)}
					</div>
				</Scroller>
				{selectedAnime && (
					<AnimeModal anime={selectedAnime} open={!!selectedAnime} onClose={props.onCloseModal} />
				)}
			</>
		);
	}
});

export default AnimeList;
