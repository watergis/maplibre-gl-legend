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
			{@const column = Math.max(
				0,
				...symbol.classes.map((c) => Number(c.svg.getAttribute('width')) || 0)
			)}
			<ul class="maplibregl-legend-classes">
				{#each symbol.classes as legendClass, i (i)}
					<li
						class="maplibregl-legend-class"
						style:--maplibregl-legend-class-symbol-height="{Number(
							legendClass.svg.getAttribute('height')
						) || 0}px"
					>
						<span
							class="maplibregl-legend-indent"
							style:--maplibregl-legend-tree-levels={node.depth + 1}
						></span>
						<span
							class="maplibregl-legend-class-symbol"
							style:min-width="{column}px"
							{@attach (span) => {
								span.replaceChildren(legendClass.svg);
							}}
						></span>
						<span class="maplibregl-legend-class-label">{legendClass.label}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</li>
{/if}
