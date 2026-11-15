import type { Meta } from '@storybook/html-vite';
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

export default { title: 'Layers/circle', ...typeMeta('circle') } satisfies Meta<TypeStoryArgs>;

/** one circle-radius: change `circle-radius` in the controls */
export const CircleRadius = layerStory('circle', 'CircleRadius', {
	paint: { 'circle-color': '#377eb8', 'circle-radius': 6 }
});

/** a stroke of 2px outside the radius, around a fill at opacity 0.6 */
export const CircleStroke = layerStory('circle', 'CircleStroke', {
	paint: {
		'circle-color': '#e41a1c',
		'circle-radius': 6,
		'circle-opacity': 0.6,
		'circle-stroke-width': 2,
		'circle-stroke-color': '#333333'
	}
});

const stories = expressionStories('circle', {
	// fill and stroke color linked to the category
	CategoricalMatch: {
		paint: {
			'circle-color': categorical([...PALETTE], FALLBACK_COLOR),
			'circle-stroke-color': categorical(['#7f0000', '#0b3c6b', '#1b5e20'], '#555555'),
			'circle-stroke-width': 2,
			'circle-radius': 6
		}
	},
	CategoricalCase: {
		paint: { 'circle-color': categoricalCase([...PALETTE], FALLBACK_COLOR), 'circle-radius': 6 }
	},
	GraduatedStep: {
		paint: {
			'circle-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']),
			'circle-radius': graduated([3, 5, 8, 12])
		}
	},
	LinearInterpolate: {
		paint: { 'circle-color': linear(['#ffffcc', '#41b6c4', '#253494']), 'circle-radius': 6 }
	},
	LinearInterpolateSize: {
		paint: { 'circle-color': '#253494', 'circle-radius': linear([3, 8, 16]) }
	},
	ExponentialInterpolate: {
		paint: {
			'circle-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'circle-radius': legacyStops([3, 6, 10])
		}
	},
	ZoomAndDataInterpolate: {
		paint: {
			'circle-color': zoomAndData(
				['#fdd0a2', '#c6dbef', '#c7e9c0'],
				[...PALETTE],
				['#eeeeee', FALLBACK_COLOR]
			),
			'circle-radius': zoomAndData([2, 2, 2], [6, 8, 10], [1, 4])
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
