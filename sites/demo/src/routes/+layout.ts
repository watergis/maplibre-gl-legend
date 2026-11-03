import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	return {
		metadata: {
			title: 'MapLibre/Mapbox GL Legend',
			description:
				'MapLibre/Mapbox GL Legend is a MapLibre/Mapbox GL JS plugin that creates a legend panel from your map style, and lets users switch layer visibility.',
			author: 'JinIgarashi',
			licenses: [
				'The source code is licensed MIT',
				'The website content is licensed CC BY NC SA 4.0.'
			],
			contact: 'https://jin-igarashi.me'
		},
		nav: [
			{ href: 'https://twitter.com/j_igarashi', icon: 'x' },
			{
				href: 'https://github.com/watergis/maplibre-gl-legend',
				icon: 'github'
			}
		]
	};
};

export const prerender = true;
export const ssr = false;
