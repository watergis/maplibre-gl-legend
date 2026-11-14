import type { Meta } from '@storybook/html-vite';
import {
	expressionStories,
	layerStory,
	typeMetaArgs,
	type TypeStoryArgs
} from './expression-stories';
import {
	categorical,
	categoricalCase,
	exponential,
	FALLBACK_COLOR,
	graduated,
	legacyStops,
	linear,
	PALETTE,
	zoomAndData
} from './fixtures/expressions';

export default { title: 'Layers/fill-extrusion', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/** one color and one height */
export const Plain = layerStory('fill-extrusion', 'Plain', {
	paint: { 'fill-extrusion-color': '#4daf4a', 'fill-extrusion-height': 20 }
});

/** fill-extrusion-opacity 0.5 */
export const Translucent = layerStory('fill-extrusion', 'Translucent', {
	paint: { 'fill-extrusion-color': '#377eb8', 'fill-extrusion-opacity': 0.5 }
});

const stories = expressionStories('fill-extrusion', {
	Categorical: { paint: { 'fill-extrusion-color': categorical([...PALETTE], FALLBACK_COLOR) } },
	CategoricalCase: {
		paint: { 'fill-extrusion-color': categoricalCase([...PALETTE], FALLBACK_COLOR) }
	},
	// color and height linked to the same field
	Graduated: {
		paint: {
			'fill-extrusion-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']),
			'fill-extrusion-height': graduated([5, 20, 60, 150])
		}
	},
	Linear: { paint: { 'fill-extrusion-color': linear(['#ffffcc', '#41b6c4', '#253494']) } },
	LinearSize: {
		paint: {
			'fill-extrusion-color': linear(['#c6dbef', '#6baed6', '#08519c']),
			'fill-extrusion-height': linear([10, 50, 200])
		}
	},
	LinearExponential: {
		paint: {
			'fill-extrusion-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'fill-extrusion-height': legacyStops([10, 50, 200])
		}
	},
	ZoomAndData: {
		paint: {
			'fill-extrusion-color': zoomAndData(
				['#fdd0a2', '#c6dbef', '#c7e9c0'],
				[...PALETTE],
				['#eeeeee', FALLBACK_COLOR]
			)
		}
	}
});

export const Categorical = stories.Categorical;
export const CategoricalCase = stories.CategoricalCase;
export const Graduated = stories.Graduated;
export const Linear = stories.Linear;
export const LinearSize = stories.LinearSize;
export const LinearExponential = stories.LinearExponential;
export const ZoomAndData = stories.ZoomAndData;
export const CustomLabels = stories.CustomLabels;
