
import kind from '@enact/core/kind';
import Popup from '@enact/sandstone/Popup';
import Image from '@enact/sandstone/Image';
import Spinner from '@enact/sandstone/Spinner';
import Button from '@enact/sandstone/Button';
import animeService from '../services/animeService';
import css from './AnimeModal.module.less';

const AnimeModal = kind({
	name: 'AnimeModal',
	props: ['anime', 'open', 'onClose'],
	getInitialState () {
		return {
			episodes: [],
			loading: true
		};
	},
	create: function () {
		// No-op, solo para mantener compatibilidad
	},
	update: function (prevProps, nextProps) {
		if (nextProps.open && nextProps.anime && (prevProps.anime !== nextProps.anime || prevProps.open !== nextProps.open)) {
			this.setState({loading: true});
			animeService.getAllAnime(1, 0).then(() => this.fetchEpisodes(nextProps.anime.id));
		}
	},
	fetchEpisodes: function (animeId) {
		fetch(`http://localhost:5000/api/anime/${animeId}`)
			.then(response => response.json())
			.then(data => {
				this.setState({episodes: data.data?.episodes || [], loading: false});
			})
			.catch(() => this.setState({episodes: [], loading: false}));
	},
	render: ({anime, open, onClose}, {episodes, loading}) => (
		<Popup open={open} onClose={onClose} noAutoDismiss>
			<div className={css.modalBody}>
				<Image src={anime.image_url} className={css.modalImage} />
				<div className={css.modalInfo}>
					<h2>{anime.title}</h2>
					{anime.rating && <div>⭐ {anime.rating}/10</div>}
					{anime.description && <div className={css.description}>{anime.description}</div>}
					<h3>Capítulos {anime.episodes_count ? `(${anime.episodes_count})` : ''}</h3>
					{loading ? (
						<Spinner center>Cargando capítulos...</Spinner>
					) : episodes.length > 0 ? (
						<div className={css.episodesGrid}>
							{episodes.map((ep) => (
								<Button key={ep.id} onClick={() => window.open(ep.url, '_blank')}>
									Cap. {ep.episode_number} {ep.title ? `- ${ep.title}` : ''}
								</Button>
							))}
						</div>
					) : (
						<div>No hay capítulos disponibles.</div>
					)}
				</div>
			</div>
		</Popup>
	)
});

export default AnimeModal;
