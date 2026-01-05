
import kind from '@enact/core/kind';
import Scroller from '@enact/sandstone/Scroller';
import Image from '@enact/sandstone/Image';
import Button from '@enact/sandstone/Button';
import Spinner from '@enact/sandstone/Spinner';
import AnimeModal from './AnimeModal';
import animeService from '../services/animeService';
import css from './Favorites.module.less';

const FavoriteCard = kind({
	name: 'FavoriteCard',
	styles: {
		css,
		className: 'animeCard'
	},
	props: ['anime', 'onRemove', 'onSelect'],
	render: ({anime, onRemove, onSelect, ...rest}) => (
		<div {...rest} className={css.card} onClick={() => onSelect(anime)}>
			<Image src={anime.image_url} className={css.cover} />
			<div className={css.info}>
				<h3>{anime.title}</h3>
				{anime.rating && <div>⭐ {anime.rating}/10</div>}
				{anime.episodes_count && <div>📺 {anime.episodes_count} episodios</div>}
				<Button small iconBefore="heart" onClick={e => {e.stopPropagation(); onRemove(anime.id);}}>
					❤️
				</Button>
			</div>
		</div>
	)
});

const Favorites = kind({
	name: 'Favorites',
	handlers: {
		onSelectAnime: (ev, {setState, anime}) => setState({selectedAnime: anime}),
		onCloseModal: (ev, {setState}) => setState({selectedAnime: null}),
		onRemoveFavorite: async (ev, {setState, favorites, animeId}) => {
			try {
				await animeService.removeFavorite(animeId);
				setState({favorites: favorites.filter(anime => anime.id !== animeId)});
			} catch {}
		}
	},
	getInitialState () {
		return {
			favorites: [],
			loading: true,
			error: null,
			selectedAnime: null
		};
	},
	create: function () {
		this.fetchFavs();
	},
	fetchFavs: function () {
		this.setState({loading: true});
		animeService.getFavorites()
			.then(result => {
				this.setState({favorites: result.data || result || [], error: null, loading: false});
			})
			.catch(() => this.setState({error: 'Error cargando favoritos', loading: false}));
	},
	render: (props, {favorites, loading, error, selectedAnime}) => {
		if (loading) return <Spinner center>Cargando favoritos...</Spinner>;
		if (error) return <div className={css.error}>{error}</div>;
		return (
			<>
				<Scroller>
					<div className={css.gallery}>
						{(!favorites || favorites.length === 0) ? (
							<div className={css.noAnime}>No tienes favoritos guardados.</div>
						) : (
							favorites.map(anime => (
								<FavoriteCard key={anime.id} anime={anime} onRemove={ev => props.onRemoveFavorite(ev, {favorites, animeId: anime.id})} onSelect={ev => props.onSelectAnime(ev, {anime})} />
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

export default Favorites;
