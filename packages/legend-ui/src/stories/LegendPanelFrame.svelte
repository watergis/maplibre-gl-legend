<!--
@component
Shows a legend panel with a mock legend source, in a MapLibre control element (the panel is shown
in one by maplibre-gl-legend).
-->
<script lang="ts">
	import type { LayerSpecification } from 'maplibre-gl';
	import LegendPanel from '../lib/components/LegendPanel.svelte';
	import { LegendModel } from '../lib/state/legend-model.svelte';
	import type { LegendPanelOptions, LegendTargets } from '../lib/types/legend-panel-options';
	import { MockSource } from './mock-source';

	interface Props {
		layers: LayerSpecification[];
		targets?: LegendTargets;
		options?: LegendPanelOptions;
		/** the IDs of the layers rendered in the view. Default: all layers */
		rendered?: string[];
		/** the IDs of the hidden layers */
		hidden?: string[];
		/** called with the layer ID when a style editor button is clicked */
		onstyleeditor?: (layerId: string, title: string) => void;
	}

	let { layers, targets = {}, options = {}, rendered, hidden, onstyleeditor }: Props = $props();

	const model = $derived.by(() => {
		const source = new MockSource({ layers, rendered, hidden });
		source.openStyleEditor = (layerId: string, title?: string) =>
			onstyleeditor?.(layerId, title ?? layerId);
		const model = new LegendModel(source, targets, options);
		// the panel follows the visibility, as maplibre-gl-legend does on `styledata`
		source.onChange = () => model.refresh();
		model.refresh();
		return model;
	});
</script>

<div class="maplibregl-ctrl maplibregl-ctrl-group legend-story">
	<LegendPanel {model} idPrefix="story-legend" />
</div>

<style>
	.legend-story {
		display: inline-block;
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
