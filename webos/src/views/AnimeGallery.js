import kind from '@enact/core/kind';
import {Panel, Header} from '@enact/sandstone/Panels';
import Image from '@enact/sandstone/Image';
import Scroller from '@enact/sandstone/Scroller';
import css from './AnimeGallery.module.less';

const animeList = [
	{
		title: 'Ghost in the Shell: Arise - Alternative Architecture',
		image: 'https://animeflv.net/uploads/animes/covers/1904.jpg',
		rating: 4.6,
		episodes: 10
	},
	{
		title: 'Hello!! Kiniro Mosaic',
		image: 'https://animeflv.net/uploads/animes/covers/1903.jpg',
		rating: 4.7,
		episodes: 12
	},
	// ...agrega más animes aquí
];

const AnimeCard = kind({
	name: 'AnimeCard',
	styles: {
		css,
		className: 'animeCard'
	},
	props: ['title', 'image', 'rating', 'episodes'],
	render: ({title, image, rating, episodes, ...rest}) => (
		<div {...rest} className={css.card}>
			<Image src={image} className={css.cover} />
			<div className={css.info}>
				<h3>{title}</h3>
				<div>⭐ {rating}/10</div>
				<div>📺 {episodes} episodios</div>
			</div>
		</div>
	)
});

const AnimeGallery = kind({
	name: 'AnimeGallery',
	render: () => (
		<Scroller>
			<div className={css.gallery}>
				{animeList.map((anime, i) => (
					<AnimeCard key={i} {...anime} />
				))}
			</div>
		</Scroller>
	)
});

export default AnimeGallery;
