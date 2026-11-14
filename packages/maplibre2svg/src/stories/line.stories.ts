import type { Meta } from '@storybook/html-vite';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { TypeStory } from './expression-stories';
import {
	expressionStories,
	layerStory,
	storyLayer,
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
import { renderLayers } from './render';

const dash = (values: number[]): ExpressionSpecification => ['literal', values];

export default { title: 'Layers/line', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/** line-width 1, 3 and 8 */
export const Widths: TypeStory = {
	render: (args) =>
		renderLayers(
			[1, 3, 8].map((width) =>
				storyLayer('line', `Width${width}`, {
					paint: { 'line-color': '#377eb8', 'line-width': width }
				})
			),
			args
		)
};

/** line-dasharray [3, 2] and [1, 1, 4] at width 2 */
export const Dashed: TypeStory = {
	render: (args) =>
		renderLayers(
			[
				[3, 2],
				[1, 1, 4]
			].map((d, i) =>
				storyLayer('line', `Dashed${i + 1}`, {
					paint: { 'line-color': '#e41a1c', 'line-width': 2, 'line-dasharray': d }
				})
			),
			args
		)
};

/** round caps on dots ([0, 2]) and square caps */
export const CapJoin: TypeStory = {
	render: (args) =>
		renderLayers(
			[
				storyLayer('line', 'RoundDots', {
					paint: { 'line-color': '#4daf4a', 'line-width': 4, 'line-dasharray': [0, 2] },
					layout: { 'line-cap': 'round', 'line-join': 'round' }
				}),
				storyLayer('line', 'Square', {
					paint: { 'line-color': '#984ea3', 'line-width': 6 },
					layout: { 'line-cap': 'square', 'line-join': 'bevel' }
				})
			],
			args
		)
};

/** two lines of width 2 with a gap of 4, like a road casing */
export const GapWidth = layerStory('line', 'GapWidth', {
	paint: { 'line-color': '#333333', 'line-width': 2, 'line-gap-width': 4 }
});

/** line-gradient along the line */
export const Gradient = layerStory('line', 'Gradient', {
	paint: {
		'line-width': 5,
		'line-gradient': [
			'interpolate',
			['linear'],
			['line-progress'],
			0,
			'#2c7bb6',
			0.5,
			'#ffffbf',
			1,
			'#d7191c'
		]
	}
});

/** legacy zoom stops for the width: move the zoom control */
export const LegacyZoomStops = layerStory('line', 'LegacyZoomStops', {
	paint: {
		'line-color': '#ff7f00',
		'line-width': {
			stops: [
				[8, 1],
				[16, 10]
			]
		}
	}
});

const stories = expressionStories('line', {
	// color, width and dashes linked to the category
	Categorical: {
		paint: {
			'line-color': categorical([...PALETTE], FALLBACK_COLOR),
			'line-width': categorical([2, 4, 6], 1),
			'line-dasharray': categorical([dash([1, 0]), dash([3, 1]), dash([1, 1])], dash([2, 2]))
		}
	},
	CategoricalCase: {
		paint: { 'line-color': categoricalCase([...PALETTE], FALLBACK_COLOR), 'line-width': 3 }
	},
	Graduated: {
		paint: {
			'line-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']),
			'line-width': graduated([1, 2, 4, 6])
		}
	},
	Linear: { paint: { 'line-color': linear(['#ffffcc', '#41b6c4', '#253494']), 'line-width': 4 } },
	LinearSize: { paint: { 'line-color': '#253494', 'line-width': linear([1, 4, 8]) } },
	LinearExponential: {
		paint: {
			'line-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'line-width': legacyStops([1, 3, 6])
		}
	},
	ZoomAndData: {
		paint: {
			'line-color': zoomAndData(
				['#fdd0a2', '#c6dbef', '#c7e9c0'],
				[...PALETTE],
				['#eeeeee', FALLBACK_COLOR]
			),
			'line-width': zoomAndData([1, 1, 1], [3, 5, 7], [0.5, 2])
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
