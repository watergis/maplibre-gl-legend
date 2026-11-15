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
} from '../utils/fixtures/expressions';
import {
	expressionStories,
	layerStory,
	typeMeta,
	type TypeStoryArgs
} from '../utils/expression-stories';
import { withImages } from '../utils/sprite';

const OUTLINES = ['#7f0000', '#0b3c6b', '#1b5e20', '#4a148c'];

export default { title: 'Layers/fill', ...typeMeta('fill') } satisfies Meta<TypeStoryArgs>;

/** one color; the outline is the fill color (fill-antialias) */
export const SingleColor = layerStory('fill', 'SingleColor', {
	paint: { 'fill-color': '#4daf4a' }
});

/** a darker fill-outline-color, which must show as a border */
export const FillOutlineColor = layerStory('fill', 'FillOutlineColor', {
	paint: { 'fill-color': '#a6cee3', 'fill-outline-color': '#1f3c88' }
});

/** fill-pattern: hatching made in code, at fill-opacity 0.8 */
export const FillPattern = layerStory(
	'fill',
	'FillPattern',
	{ paint: { 'fill-color': '#cccccc', 'fill-pattern': 'hatch', 'fill-opacity': 0.8 } },
	{ setup: withImages }
);

/** fill-opacity 0.4, which the outline shares */
export const TranslucentFill = layerStory('fill', 'TranslucentFill', {
	paint: { 'fill-color': '#e41a1c', 'fill-outline-color': '#000000', 'fill-opacity': 0.4 }
});

const stories = expressionStories('fill', {
	// color and outline linked to the category
	CategoricalMatch: {
		paint: {
			'fill-color': categorical([...PALETTE], FALLBACK_COLOR),
			'fill-outline-color': categorical(OUTLINES, '#555555')
		}
	},
	CategoricalCase: { paint: { 'fill-color': categoricalCase([...PALETTE], FALLBACK_COLOR) } },
	GraduatedStep: {
		paint: { 'fill-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']) }
	},
	// color ramp and opacity on the same field
	LinearInterpolate: {
		paint: {
			'fill-color': linear(['#ffffcc', '#41b6c4', '#253494']),
			'fill-opacity': linear([0.3, 0.6, 1])
		}
	},
	ExponentialInterpolate: {
		paint: {
			'fill-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'fill-opacity': legacyStops([0.3, 0.6, 1])
		}
	},
	ZoomAndDataInterpolate: {
		paint: {
			'fill-color': zoomAndData(
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
/** exponential `interpolate` and legacy `stops` */
export const ExponentialInterpolate = stories.ExponentialInterpolate;
/** `interpolate` on the zoom whose stops are `match` expressions: move the zoom control */
export const ZoomAndDataInterpolate = stories.ZoomAndDataInterpolate;
/** `CategoricalMatch` with labels from `metadata.legend`; `showDefault` hides the fallback */
export const CustomLabels = stories.CustomLabels;
