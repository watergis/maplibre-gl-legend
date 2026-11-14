import type { Meta } from '@storybook/html-vite';
import { layerStory, typeMetaArgs, type TypeStoryArgs } from './expression-stories';

export default { title: 'Layers/background', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/** one color */
export const Plain = layerStory('background', 'Plain', {
	paint: { 'background-color': '#f2efe9' }
});

/** background-opacity 0.4 */
export const Translucent = layerStory('background', 'Translucent', {
	paint: { 'background-color': '#08519c', 'background-opacity': 0.4 }
});
