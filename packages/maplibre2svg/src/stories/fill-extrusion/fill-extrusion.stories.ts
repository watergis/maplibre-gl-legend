import type { Meta } from '@storybook/html-vite';
import {
	expressionStories,
	layerStory,
	typeMeta,
	type TypeStoryArgs
} from '../utils/expression-stories';
import { withImages } from '../utils/sprite';
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

export default {
	title: 'Layers/fill-extrusion',
	...typeMeta('fill-extrusion')
} satisfies Meta<TypeStoryArgs>;

/** one color and one height */
export const SingleColor = layerStory('fill-extrusion', 'SingleColor', {
	paint: { 'fill-extrusion-color': '#4daf4a', 'fill-extrusion-height': 20 }
});

/** fill-extrusion-pattern on the top face: hatching made in code */
export const FillExtrusionPattern = layerStory(
	'fill-extrusion',
	'FillExtrusionPattern',
	{ paint: { 'fill-extrusion-color': '#9ecae1', 'fill-extrusion-pattern': 'hatch' } },
	{ setup: withImages }
);

/** fill-extrusion-opacity 0.5 */
export const TranslucentFillExtrusion = layerStory('fill-extrusion', 'TranslucentFillExtrusion', {
	paint: { 'fill-extrusion-color': '#377eb8', 'fill-extrusion-opacity': 0.5 }
});

const stories = expressionStories('fill-extrusion', {
	CategoricalMatch: {
		paint: { 'fill-extrusion-color': categorical([...PALETTE], FALLBACK_COLOR) }
	},
	CategoricalCase: {
		paint: { 'fill-extrusion-color': categoricalCase([...PALETTE], FALLBACK_COLOR) }
	},
	// color and height linked to the same field
	GraduatedStep: {
		paint: {
			'fill-extrusion-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']),
			'fill-extrusion-height': graduated([5, 20, 60, 150])
		}
	},
	LinearInterpolate: {
		paint: { 'fill-extrusion-color': linear(['#ffffcc', '#41b6c4', '#253494']) }
	},
	LinearInterpolateSize: {
		paint: {
			'fill-extrusion-color': linear(['#c6dbef', '#6baed6', '#08519c']),
			'fill-extrusion-height': linear([10, 50, 200])
		}
	},
	ExponentialInterpolate: {
		paint: {
			'fill-extrusion-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'fill-extrusion-height': legacyStops([10, 50, 200])
		}
	},
	ZoomAndDataInterpolate: {
		paint: {
			'fill-extrusion-color': zoomAndData(
				['#fdd0a2', '#c6dbef', '#c7e9c0'],
				[...PALETTE],
				['#eeeeee', FALLBACK_COLOR]
			)
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
