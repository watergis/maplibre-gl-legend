<!--
	The style editor as maplibre-gl-legend opens it, over a MapLibre map: a story per layer type.
	The data is generated in the browser (see `src/stories/layer-stories.ts`).
-->
<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import MapFrame from '../../stories/MapFrame.svelte';
	import { LAYER_STORIES } from '../../stories/layer-stories';

	const { Story } = defineMeta({
		title: 'Dialog/StyleEditorDialog',
		component: MapFrame,
		parameters: {
			layout: 'fullscreen',
			// on the Docs page, the story is drawn in an iframe: the dialog is placed in the window
			docs: { story: { inline: false, height: '640px' } }
		},
		argTypes: {
			position: {
				control: 'select',
				options: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
			},
			story: { control: false },
			size: { control: 'object' }
		},
		args: { position: 'top-left', onChange: fn(), onClose: fn() }
	});
</script>

<Story name="Background" args={{ story: LAYER_STORIES.background }} />
<Story name="Fill" args={{ story: LAYER_STORIES.fill }} />
<Story name="Fill (expression)" args={{ story: LAYER_STORIES.fillExpression }} />
<Story name="Line" args={{ story: LAYER_STORIES.line }} />
<Story name="Line (dashed)" args={{ story: LAYER_STORIES.lineDashed }} />
<Story name="Symbol (text)" args={{ story: LAYER_STORIES.symbolText }} />
<Story name="Symbol (SDF icon)" args={{ story: LAYER_STORIES.symbolSdfIcon }} />
<Story name="Symbol (icon)" args={{ story: LAYER_STORIES.symbolIcon }} />
<Story name="Circle" args={{ story: LAYER_STORIES.circle }} />
<Story name="Fill extrusion" args={{ story: LAYER_STORIES.fillExtrusion }} />
<Story name="Raster" args={{ story: LAYER_STORIES.raster }} />
<Story name="Hillshade" args={{ story: LAYER_STORIES.hillshade }} />
<Story name="Color relief" args={{ story: LAYER_STORIES.colorRelief }} />
<Story name="Heatmap" args={{ story: LAYER_STORIES.heatmap }} />
<Story name="Bottom right" args={{ story: LAYER_STORIES.fill, position: 'bottom-right' }} />
<!-- the dialog is dragged only inside the map, and is not higher than the map: its body scrolls -->
<Story
	name="Small map"
	args={{ story: LAYER_STORIES.symbolSdfIcon, size: { width: '640px', height: '360px' } }}
/>
