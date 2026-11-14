import type { Meta } from '@storybook/html-vite';
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
import {
	expressionStories,
	layerStory,
	typeMetaArgs,
	type TypeStoryArgs
} from './expression-stories';
import { storyImages } from './sprite';

const OUTLINES = ['#7f0000', '#0b3c6b', '#1b5e20', '#4a148c'];

export default { title: 'Layers/fill', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/** one color; the outline is the fill color (fill-antialias) */
export const Plain = layerStory('fill', 'Plain', { paint: { 'fill-color': '#4daf4a' } });

/** a darker fill-outline-color, which must show as a border */
export const OutlineColor = layerStory('fill', 'OutlineColor', {
	paint: { 'fill-color': '#a6cee3', 'fill-outline-color': '#1f3c88' }
});

/** fill-pattern: hatching made in code, at fill-opacity 0.8 */
export const Pattern = layerStory(
	'fill',
	'Pattern',
	{ paint: { 'fill-color': '#cccccc', 'fill-pattern': 'hatch', 'fill-opacity': 0.8 } },
	storyImages
);

/** fill-opacity 0.4, which the outline shares */
export const Translucent = layerStory('fill', 'Translucent', {
	paint: { 'fill-color': '#e41a1c', 'fill-outline-color': '#000000', 'fill-opacity': 0.4 }
});

const stories = expressionStories('fill', {
	// color and outline linked to the category
	Categorical: {
		paint: {
			'fill-color': categorical([...PALETTE], FALLBACK_COLOR),
			'fill-outline-color': categorical(OUTLINES, '#555555')
		}
	},
	CategoricalCase: { paint: { 'fill-color': categoricalCase([...PALETTE], FALLBACK_COLOR) } },
	Graduated: { paint: { 'fill-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']) } },
	// color ramp and opacity on the same field
	Linear: {
		paint: {
			'fill-color': linear(['#ffffcc', '#41b6c4', '#253494']),
			'fill-opacity': linear([0.3, 0.6, 1])
		}
	},
	LinearExponential: {
		paint: {
			'fill-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'fill-opacity': legacyStops([0.3, 0.6, 1])
		}
	},
	ZoomAndData: {
		paint: {
			'fill-color': zoomAndData(
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
export const LinearExponential = stories.LinearExponential;
export const ZoomAndData = stories.ZoomAndData;
export const CustomLabels = stories.CustomLabels;
