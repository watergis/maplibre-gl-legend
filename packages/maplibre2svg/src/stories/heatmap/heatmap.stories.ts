import type { Meta } from '@storybook/html-vite';
import { layerStory, typeMeta, type TypeStoryArgs } from '../utils/expression-stories';

export default { title: 'Layers/heatmap', ...typeMeta('heatmap') } satisfies Meta<TypeStoryArgs>;

/** the default ramp of the specification, transparent at density 0 */
export const DefaultColorRamp = layerStory('heatmap', 'DefaultColorRamp', { paint: {} });

/** a custom ramp with heatmap-opacity 0.8 */
export const CustomColorRamp = layerStory('heatmap', 'CustomColorRamp', {
	paint: {
		'heatmap-color': [
			'interpolate',
			['linear'],
			['heatmap-density'],
			0,
			'rgba(33,102,172,0)',
			0.2,
			'rgb(103,169,207)',
			0.4,
			'rgb(209,229,240)',
			0.6,
			'rgb(253,219,199)',
			0.8,
			'rgb(239,138,98)',
			1,
			'rgb(178,24,43)'
		],
		'heatmap-opacity': 0.8
	}
});

/** a step ramp: hard edges */
export const StepColorRamp = layerStory('heatmap', 'StepColorRamp', {
	paint: {
		'heatmap-color': [
			'step',
			['heatmap-density'],
			'rgba(0,0,0,0)',
			0.25,
			'#fee5d9',
			0.5,
			'#fcae91',
			0.75,
			'#de2d26'
		]
	}
});
