<!--
@component
Shows the components of the legend with a mock legend source, as they are shown in the legend panel
of maplibre-gl-legend: in a MapLibre control (`.maplibregl-ctrl.maplibregl-ctrl-group`) and the
panel element (`.maplibregl-legend-list`, where the custom properties of the styles are set).

The model is made from the props and passed to the children, which pick the rows they show from it
(see `view.ts`).
-->
<script lang="ts">
	import type { LayerSpecification } from 'maplibre-gl';
	import type { Snippet } from 'svelte';
	import '../lib/legend.css';
	import { LegendModel } from '../lib/state/legend-model.svelte';
	import type { LegendPanelOptions, LegendTargets } from '../lib/types/legend-panel-options';
	import type { LayerSymbol } from '../lib/types/legend-source';
	import { LAYERS, TARGETS } from './fixtures';
	import { MockSource } from './mock-source';

	interface Props {
		layers?: LayerSpecification[];
		targets?: LegendTargets;
		options?: LegendPanelOptions;
		/** the IDs of the layers rendered in the view. Default: all layers */
		rendered?: string[];
		/** the IDs of the hidden layers */
		hidden?: string[];
		/** the symbols of some layers, in place of a swatch */
		symbols?: Record<string, () => LayerSymbol>;
		/** called with the layer ID when a style editor button is clicked */
		onstyleeditor?: (layerId: string, title: string) => void;
		children: Snippet<[LegendModel]>;
	}

	let {
		layers = LAYERS,
		targets = TARGETS,
		options = { onlyRendered: false },
		rendered,
		hidden,
		symbols = {},
		onstyleeditor,
		children
	}: Props = $props();

	const model = $derived.by(() => {
		const source = new MockSource({ layers, rendered, hidden });
		const swatch = source.createSymbol.bind(source);
		source.createSymbol = (layer) => {
			const symbol = symbols[layer.id];
			return symbol ? Promise.resolve(symbol()) : swatch(layer);
		};
		source.openStyleEditor = (layerId: string, title?: string) =>
			onstyleeditor?.(layerId, title ?? layerId);
		const model = new LegendModel(source, targets, options);
		// the rows follow the visibility, as maplibre-gl-legend does on `styledata`
		source.onChange = () => model.refresh();
		model.refresh();
		return model;
	});
</script>

<div class="maplibregl-ctrl maplibregl-ctrl-group legend-story">
	<div class="maplibregl-legend-list" style:display="block">
		{@render children(model)}
	</div>
</div>

<style>
	.legend-story {
		display: inline-block;
		min-width: 240px;
		font:
			12px / 20px 'Helvetica Neue',
			Arial,
			Helvetica,
			sans-serif;
		background: #fff;
		border-radius: 4px;
		box-shadow: 0 0 0 2px rgb(0 0 0 / 10%);
	}
</style>
