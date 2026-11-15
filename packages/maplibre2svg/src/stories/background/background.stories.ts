import type { Meta } from '@storybook/html-vite';
import { layerStory, typeMeta, type TypeStoryArgs } from '../utils/expression-stories';
import { withImages } from '../utils/sprite';

export default {
	title: 'Layers/background',
	...typeMeta('background')
} satisfies Meta<TypeStoryArgs>;

/** one color */
export const SingleColor = layerStory('background', 'SingleColor', {
	paint: { 'background-color': '#f2efe9' }
});

/** background-pattern: hatching made in code */
export const BackgroundPattern = layerStory(
	'background',
	'BackgroundPattern',
	{ paint: { 'background-color': '#ffffff', 'background-pattern': 'hatch' } },
	{ setup: withImages }
);

/** background-opacity 0.4 */
export const TranslucentBackground = layerStory('background', 'TranslucentBackground', {
	paint: { 'background-color': '#08519c', 'background-opacity': 0.4 }
});
