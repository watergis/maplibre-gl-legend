<!-- The fields of each layer type, with the layers of the dialog stories on a mock map -->
<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { LAYER_STORIES, type LayerStory } from '../../stories/layer-stories';
	import { createMockMap } from '../../stories/mock-map';
	import LayerPanel from './LayerPanel.svelte';

	interface Args {
		story: LayerStory;
		onchange: (property: string, value: unknown) => void;
		onmanualeditor: () => void;
	}

	const { Story } = defineMeta({
		title: 'Panels/LayerPanel',
		argTypes: { story: { control: false } },
		args: { onchange: fn(), onmanualeditor: fn() }
	});
</script>

{#snippet template(args: Args)}
	{#key args.story}
		<EditorContextFrame
			map={createMockMap(args.story.style.layers, ['pin-sdf'])}
			layerId={args.story.layerId}
			onchange={args.onchange}
			onmanualeditor={args.onmanualeditor}
		>
			<LayerPanel />
		</EditorContextFrame>
	{/key}
{/snippet}

<Story name="Background" {template} args={{ story: LAYER_STORIES.background }} />
<Story name="Fill" {template} args={{ story: LAYER_STORIES.fill }} />
<Story name="Line" {template} args={{ story: LAYER_STORIES.line }} />
<Story name="Symbol (text)" {template} args={{ story: LAYER_STORIES.symbolText }} />
<Story name="Symbol (SDF icon)" {template} args={{ story: LAYER_STORIES.symbolSdfIcon }} />
<Story name="Symbol (icon)" {template} args={{ story: LAYER_STORIES.symbolIcon }} />
<Story name="Circle" {template} args={{ story: LAYER_STORIES.circle }} />
<Story name="Fill extrusion" {template} args={{ story: LAYER_STORIES.fillExtrusion }} />
<Story name="Raster" {template} args={{ story: LAYER_STORIES.raster }} />
<Story name="Hillshade" {template} args={{ story: LAYER_STORIES.hillshade }} />
<Story name="Color relief" {template} args={{ story: LAYER_STORIES.colorRelief }} />
<Story name="Heatmap" {template} args={{ story: LAYER_STORIES.heatmap }} />
<Story
	name="No field"
	{template}
	args={{
		story: {
			layerId: 'custom',
			title: 'Custom',
			style: {
				version: 8,
				sources: {},
				layers: [{ id: 'custom', type: 'sky' as never } as never]
			}
		}
	}}
/>
