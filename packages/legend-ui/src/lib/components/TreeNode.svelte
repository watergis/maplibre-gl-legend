<!--
@component
A node of the legend tree: a {@link TreeGroup} or a {@link TreeLayer}.
-->
<script lang="ts">
	import type { LegendModel } from '../state/legend-model.svelte';
	import type { LegendViewNode } from '../tree/legend-view';
	import TreeGroup from './TreeGroup.svelte';
	import TreeLayer from './TreeLayer.svelte';

	interface Props {
		model: LegendModel;
		node: LegendViewNode;
	}

	let { model, node }: Props = $props();
</script>

{#if node.type === 'group'}
	<TreeGroup {model} {node} />
{:else}
	<TreeLayer {model} {node} />
{/if}
