<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { createMockMap } from '../../stories/mock-map';
	import HeatmapGenerator from './HeatmapGenerator.svelte';

	const { Story } = defineMeta({
		title: 'Controls/HeatmapGenerator',
		parameters: {
			docs: {
				description: {
					component:
						'Adds a heatmap layer `{layer id} heatmap` made from the features of the layer, below it, or removes it.'
				}
			}
		}
	});
</script>

{#snippet template(args: { heatmap: boolean })}
	{@const layers = [
		{ id: 'points', type: 'circle', source: 'points' } as const,
		...(args.heatmap ? [{ id: 'points heatmap', type: 'heatmap', source: 'points' } as const] : [])
	]}
	<EditorContextFrame map={createMockMap(layers)} layerId="points">
		<label for="story-heatmap">Heatmap</label>
		<HeatmapGenerator id="story-heatmap" />
	</EditorContextFrame>
{/snippet}

<Story name="Without heatmap" {template} args={{ heatmap: false }} />
<Story name="With heatmap" {template} args={{ heatmap: true }} />
