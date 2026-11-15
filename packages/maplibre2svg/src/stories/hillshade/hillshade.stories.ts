import type { Meta } from '@storybook/html-vite';
import type { LayerSpecification } from 'maplibre-gl';
import {
	layerStory,
	typeMeta,
	type TypeStory,
	type TypeStoryArgs
} from '../utils/expression-stories';
import { renderLegend } from '../utils/render';
import { argsToParts } from '../utils/render/spec-args';
import { loadStyle, UNDP_STYLE, UNVT_STYLE } from '../utils/sprite';

export default {
	title: 'Layers/hillshade',
	...typeMeta('hillshade')
} satisfies Meta<TypeStoryArgs>;

/** the defaults: white highlight, black shadow, light from 335° */
export const DefaultColors = layerStory('hillshade', 'DefaultColors', { paint: {} });

/** custom highlight, shadow and accent colors */
export const CustomColors = layerStory('hillshade', 'CustomColors', {
	paint: {
		'hillshade-highlight-color': '#fff3c4',
		'hillshade-shadow-color': '#3b2f6b',
		'hillshade-accent-color': '#7a3b00',
		'hillshade-exaggeration': 0.8
	}
});

/** the light from 335°, with exaggeration 0.8: change the direction in the controls */
export const IlluminationDirection = layerStory('hillshade', 'IlluminationDirection', {
	paint: { 'hillshade-illumination-direction': 335, 'hillshade-exaggeration': 0.8 }
});

/**
 * The first hillshade layer of a real style. The properties set in the controls replace those
 * of the layer.
 */
function styleHillshade(url: string): TypeStory {
	return {
		render: (args) => {
			const root = document.createElement('div');
			root.textContent = 'Loading the style…';
			loadStyle(url)
				.then(({ style }) => {
					const layer = style.layers.find((l) => l.type === 'hillshade');
					if (!layer) {
						root.textContent = `${url} has no hillshade layer`;
						return;
					}
					const parts = argsToParts('hillshade', args);
					const paint = { ...('paint' in layer ? layer.paint : {}), ...parts.paint };
					root.replaceChildren(renderLegend({ ...layer, paint } as LayerSpecification, args));
				})
				.catch((error: unknown) => (root.textContent = `Cannot load ${url}: ${String(error)}`));
			return root;
		}
	};
}

/** the hillshade of the UNDP style */
export const UndpStyleHillshade = styleHillshade(UNDP_STYLE);

/** the hillshade of the unvt style */
export const UnvtStyleHillshade = styleHillshade(UNVT_STYLE);
