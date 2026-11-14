import type { Meta } from '@storybook/html-vite';
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

export default { title: 'Layers/circle', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/** circle-radius 2, 6 and 12 */
export const Radii: TypeStory = {
	render: (args) =>
		renderLayers(
			[2, 6, 12].map((radius) =>
				storyLayer('circle', `Radius${radius}`, {
					paint: { 'circle-color': '#377eb8', 'circle-radius': radius }
				})
			),
			args
		)
};

/** a white stroke of 2px outside the radius, at half opacity fill */
export const Stroke = layerStory('circle', 'Stroke', {
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
	Categorical: {
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
	Graduated: {
		paint: {
			'circle-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']),
			'circle-radius': graduated([3, 5, 8, 12])
		}
	},
	Linear: {
		paint: { 'circle-color': linear(['#ffffcc', '#41b6c4', '#253494']), 'circle-radius': 6 }
	},
	LinearSize: { paint: { 'circle-color': '#253494', 'circle-radius': linear([3, 8, 16]) } },
	LinearExponential: {
		paint: {
			'circle-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
			'circle-radius': legacyStops([3, 6, 10])
		}
	},
	ZoomAndData: {
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

export const Categorical = stories.Categorical;
export const CategoricalCase = stories.CategoricalCase;
export const Graduated = stories.Graduated;
export const Linear = stories.Linear;
export const LinearSize = stories.LinearSize;
export const LinearExponential = stories.LinearExponential;
export const ZoomAndData = stories.ZoomAndData;
export const CustomLabels = stories.CustomLabels;
