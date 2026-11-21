<!--
@component
A layer of the legend tree: its symbol, title, eye toggle and style button, and the classes of a
layer styled by data one level deeper. A layer which has nothing to draw is not listed.
-->
<script lang="ts">
	import type { LegendModel } from '../state/legend-model.svelte';
	import type { LayerView } from '../tree/legend-view';
	import type { LayerSymbol as Symbol } from '../types/legend-source';
	import LayerSymbol from './LayerSymbol.svelte';
	import TreeRow from './TreeRow.svelte';

	interface Props {
		model: LegendModel;
		node: LayerView;
	}

	let { model, node }: Props = $props();

	/** the symbol of the layer, once drawn */
	let symbol: Symbol | undefined = $state();

	$effect(() => {
		const promise = model.symbol(node.layer.id);
		let current = true;
		promise.then((s) => {
			if (current) symbol = s;
		});
		return () => {
			current = false;
		};
	});
</script>

{#if symbol?.type !== 'none'}
	<li class="maplibregl-legend-node maplibregl-legend-layer" data-layer={node.layer.id}>
		<TreeRow
			{model}
			depth={node.depth}
			title={node.title}
			toggleLayerIds={node.toggleLayerIds}
			toggleName={node.layer.id}
			groupToggle={node.group}
		>
			{#snippet lead()}
				{#if symbol && symbol.type !== 'classes'}
					<LayerSymbol {symbol} />
				{/if}
			{/snippet}
			{#snippet styleButton()}
				<button
					type="button"
					class="maplibregl-legend-style-button"
					aria-label="Edit style of {node.title}"
					title="Edit style"
					onclick={() => model.openStyleEditor(node.layer.id, node.title)}
				></button>
			{/snippet}
		</TreeRow>
		{#if symbol?.type === 'classes'}
			{@const svg = symbol.svg}
			<div class="maplibregl-legend-classes">
				<span
					class="maplibregl-legend-indent"
					style:--maplibregl-legend-tree-levels={node.depth + 1}
				></span>
				<span
					class="maplibregl-legend-classes-symbols"
					{@attach (span) => {
						span.replaceChildren(svg);
					}}
				></span>
			</div>
		{/if}
	</li>
{/if}
