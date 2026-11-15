import type { Meta } from '@storybook/html-vite';
import type { ExpressionSpecification } from 'maplibre-gl';
import { withImages } from '../utils/sprite';
import {
	expressionStories,
	layerStory,
	typeMeta,
	type TypeStoryArgs
} from '../utils/expression-stories';
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
} from '../utils/fixtures/expressions';

const dash = (values: number[]): ExpressionSpecification => ['literal', values];

export default { title: 'Layers/line', ...typeMeta('line') } satisfies Meta<TypeStoryArgs>;

/** one line-width: change `line-width` in the controls */
export const LineWidth = layerStory('line', 'LineWidth', {
	paint: { 'line-color': '#377eb8', 'line-width': 3 }
});

/** line-dasharray [3, 2] at width 2: edit the array in the controls */
export const DashedLine = layerStory('line', 'DashedLine', {
	paint: { 'line-color': '#e41a1c', 'line-width': 2, 'line-dasharray': [3, 2] }
});

/** round caps on dashes of length 0 ([0, 2]): a dotted line */
export const RoundCapDottedLine = layerStory('line', 'RoundCapDottedLine', {
	paint: { 'line-color': '#4daf4a', 'line-width': 4, 'line-dasharray': [0, 2] },
	layout: { 'line-cap': 'round', 'line-join': 'round' }
});

/** square caps and bevel joins on a wide line */
export const SquareCapBevelJoin = layerStory('line', 'SquareCapBevelJoin', {
	paint: { 'line-color': '#984ea3', 'line-width': 6 },
	layout: { 'line-cap': 'square', 'line-join': 'bevel' }
});

/** two lines of width 2 with a gap of 4, like a road casing */
export const GapWidthCasing = layerStory('line', 'GapWidthCasing', {
	paint: { 'line-color': '#333333', 'line-width': 2, 'line-gap-width': 4 }
});

/** line-gradient along the line */
export const LineGradient = layerStory('line', 'LineGradient', {
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

/** line-pattern: the `oneway` arrow of the sprite, scaled to the line width 8 */
export const LinePattern = layerStory(
	'line',
	'LinePattern',
	{ paint: { 'line-width': 8, 'line-pattern': 'oneway' } },
	{ setup: withImages }
);

/** legacy zoom stops for the width: move the zoom control */
export const LegacyZoomStopsWidth = layerStory('line', 'LegacyZoomStopsWidth', {
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
	CategoricalMatch: {
		paint: {
			'line-color': categorical([...PALETTE], FALLBACK_COLOR),
			'line-width': categorical([2, 4, 6], 1),
			'line-dasharray': categorical([dash([1, 0]), dash([3, 1]), dash([1, 1])], dash([2, 2]))
		}
	},
	CategoricalCase: {
		paint: { 'line-color': categoricalCase([...PALETTE], FALLBACK_COLOR), 'line-width': 3 }
	},
	GraduatedStep: {
		paint: {
			'line-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']),
			'line-width': graduated([1, 2, 4, 6])
		}
	},
	LinearInterpolate: {
		paint: { 'line-color': linear(['#ffffcc', '#41b6c4', '#253494']), 'line-width': 4 }
	},
	LinearInterpolateSize: { paint: { 'line-color': '#253494', 'line-width': linear([1, 4, 8]) } },
	ExponentialInterpolate: {
		paint: {
			'line-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'line-width': legacyStops([1, 3, 6])
		}
	},
	ZoomAndDataInterpolate: {
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

/** `match` on a field: one entry per value, and the fallback */
export const CategoricalMatch = stories.CategoricalMatch;
/** `case` with conditions on fields: one entry per condition, and the fallback */
export const CategoricalCase = stories.CategoricalCase;
/** `step` on a number: one entry per interval */
export const GraduatedStep = stories.GraduatedStep;
/** linear `interpolate` on a number: one entry per stop */
export const LinearInterpolate = stories.LinearInterpolate;
/** linear `interpolate` of the size: the symbols grow with the value */
export const LinearInterpolateSize = stories.LinearInterpolateSize;
/** exponential `interpolate` and legacy `stops` */
export const ExponentialInterpolate = stories.ExponentialInterpolate;
/** `interpolate` on the zoom whose stops are `match` expressions: move the zoom control */
export const ZoomAndDataInterpolate = stories.ZoomAndDataInterpolate;
/** `CategoricalMatch` with labels from `metadata.legend`; `showDefault` hides the fallback */
export const CustomLabels = stories.CustomLabels;
