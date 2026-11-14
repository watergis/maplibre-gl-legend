import type { Meta } from '@storybook/html-vite';
import type { LayerSpecification } from 'maplibre-gl';
import {
	layerStory,
	storyLayer,
	typeMetaArgs,
	type TypeStory,
	type TypeStoryArgs
} from './expression-stories';
import { renderLayers } from './render';
import { loadStyle, UNDP_STYLE, UNVT_STYLE } from './sprite';

export default { title: 'Layers/hillshade', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/** the defaults: white highlight, black shadow, light from 335° */
export const Defaults = layerStory('hillshade', 'Defaults', { paint: {} });

/** custom highlight, shadow and accent colors */
export const CustomColors = layerStory('hillshade', 'CustomColors', {
	paint: {
		'hillshade-highlight-color': '#fff3c4',
		'hillshade-shadow-color': '#3b2f6b',
		'hillshade-accent-color': '#7a3b00',
		'hillshade-exaggeration': 0.8
	}
});

/** the light from the north, east, south and west */
export const Directions: TypeStory = {
	render: (args) =>
		renderLayers(
			[0, 90, 180, 270].map((direction) =>
				storyLayer('hillshade', `Direction${direction}`, {
					paint: { 'hillshade-illumination-direction': direction, 'hillshade-exaggeration': 0.8 }
				})
			),
			args
		)
};

/** the hillshade layer of a real style, as it is */
function realHillshade(url: string): TypeStory {
	return {
		render: (args) => {
			const root = document.createElement('div');
			root.textContent = 'Loading the style…';
			loadStyle(url)
				.then(({ style }) => {
					const layers = style.layers.filter(
						(l): l is LayerSpecification => l.type === 'hillshade'
					);
					root.replaceChildren(renderLayers(layers, args));
				})
				.catch((error: unknown) => (root.textContent = `Cannot load ${url}: ${String(error)}`));
			return root;
		}
	};
}

/** the hillshade of the UNDP style */
export const RealUndp = realHillshade(UNDP_STYLE);

/** the hillshade of the unvt style */
export const RealUnvt = realHillshade(UNVT_STYLE);
