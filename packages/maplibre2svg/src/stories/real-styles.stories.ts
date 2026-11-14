import type { Meta } from '@storybook/html-vite';
import type { LayerSpecification } from 'maplibre-gl';
import { typeMetaArgs, type TypeStory, type TypeStoryArgs } from './expression-stories';
import { renderLayers } from './render';
import { combine, GENERATED_IMAGES, loadStyle, UNDP_STYLE, UNVT_STYLE } from './sprite';

export default { title: 'Real styles', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/**
 * Layers taken from a real style, as they are, with the images and glyphs of the style.
 * Rendered when the style has loaded.
 */
function styleStory(url: string, ids: string[]): TypeStory {
	return {
		render: (args) => {
			const root = document.createElement('div');
			root.textContent = 'Loading the style…';
			loadStyle(url)
				.then(({ style, images }) => {
					const layers = ids
						.map((id) => style.layers.find((layer) => layer.id === id))
						.filter((layer): layer is LayerSpecification => layer !== undefined);
					root.replaceChildren(
						renderLayers(layers, args, {
							options: combine(GENERATED_IMAGES, images),
							style: { glyphs: style.glyphs }
						})
					);
				})
				.catch((error: unknown) => {
					root.textContent = `Cannot load ${url}: ${String(error)}`;
				});
			return root;
		}
	};
}

/** UNDP symbol layers with icon-color: the SDF `circle` tinted, and labels in Proxima Nova */
export const UndpIconColor = styleStory(UNDP_STYLE, [
	'place_city_dot_r7',
	'place_city_dot_r4',
	'place_capital_dot_z7'
]);

/** UNDP label layers */
export const UndpLabels = styleStory(UNDP_STYLE, [
	'place_town',
	'place_city_r6',
	'watername_ocean',
	'roadname_pri',
	'poi_park'
]);

/** unvt label and icon layers: `{class}_11` and the highway shields resolved from the filter */
export const UnvtLabels = styleStory(UNVT_STYLE, [
	'place-city',
	'poi-railway',
	'poi-level-1',
	'highway-shield-us-interstate',
	'water-name-ocean',
	'meter'
]);
