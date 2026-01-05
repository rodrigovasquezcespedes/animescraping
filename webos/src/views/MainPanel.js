


import kind from '@enact/core/kind';
import Panel from '@enact/sandstone/Panels/Panel';
import Heading from '@enact/sandstone/Heading';
import Button from '@enact/sandstone/Button';
import AnimeList from './AnimeList';
import Favorites from './Favorites';

const MainPanel = kind({
	name: 'MainPanel',
	handlers: {
		onCategory: (ev, {setState, category}) => setState({category, showFavorites: false, selectedGenre: ''}),
		onShowFavorites: (ev, {setState}) => setState({showFavorites: true, category: '', selectedGenre: ''}),
		onSelectGenre: (ev, {setState, genre}) => setState({category: 'dorama', selectedGenre: genre, showFavorites: false}),
	},
	defaultProps: {
		category: 'anime',
		showFavorites: false,
		doramaGenres: [],
		selectedGenre: '',
	},
	computed: {
		genres: ({doramaGenres}) => doramaGenres || [],
	},
	getInitialState () {
		return {
			category: 'anime',
			showFavorites: false,
			doramaGenres: [],
			selectedGenre: ''
		};
	},
	create: function () {
		this.fetchDoramaGenres();
	},
	fetchDoramaGenres: function () {
		fetch('http://localhost:5000/api/anime/genres/doramas')
			.then(response => response.ok ? response.json() : {data: []})
			.then(result => {
				this.setState({doramaGenres: result.data || []});
			})
			.catch(() => this.setState({doramaGenres: []}));
	},
		render: (props, state) => {
			state = state || {};
			const {
				category = 'anime',
				showFavorites = false,
				doramaGenres = [],
				selectedGenre = ''
			} = state;
			return (
				<Panel>
					<Heading showLine>{"CinoTV"}</Heading>
					<Button size="small" selected={category==='anime'&&!showFavorites} onClick={props.onCategory} category="anime">Anime</Button>
					<Button size="small" selected={category==='dorama'&&!showFavorites} onClick={props.onCategory} category="dorama">Dorama</Button>
					{category==='dorama' && doramaGenres.length > 0 && (
						<span style={{marginLeft: 8}}>
							Género:
							{doramaGenres.map(genre => (
								<Button key={genre} size="small" selected={selectedGenre===genre} onClick={ev => props.onSelectGenre(ev, {genre})}>{genre}</Button>
							))}
						</span>
					)}
					<Button size="small" selected={category==='serie'&&!showFavorites} onClick={props.onCategory} category="serie">Series</Button>
					<Button size="small" selected={category==='pelicula'&&!showFavorites} onClick={props.onCategory} category="pelicula">Películas</Button>
					<Button size="small" selected={showFavorites} onClick={props.onShowFavorites}>Favoritos</Button>
					{showFavorites ? (
						<Favorites />
					) : (
						<AnimeList category={category} genre={selectedGenre} />
					)}
				</Panel>
			);
		}
});

export default MainPanel;
