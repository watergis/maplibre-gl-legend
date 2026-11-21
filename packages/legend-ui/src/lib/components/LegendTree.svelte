<!--
@component
The tree of layers and groups of the legend, made from the rows of the model.
-->
<script lang="ts">
	import type { LegendModel } from '../state/legend-model.svelte';
	import TreeNode from './TreeNode.svelte';

	interface Props {
		model: LegendModel;
	}

	let { model }: Props = $props();
</script>

<ul class="maplibregl-legend-tree">
	{#each model.view as node (node.key)}
		<TreeNode {model} {node} />
	{/each}
</ul>
