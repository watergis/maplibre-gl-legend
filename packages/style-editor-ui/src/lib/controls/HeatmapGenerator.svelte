<!--
	Switch adding a heatmap layer made from the features of the layer, below it, or removing it.
	The heatmap layer is `{layer id} heatmap`, and can be edited from the legend as any layer.
-->
<script lang="ts">
	import type { HeatmapLayerSpecification } from 'maplibre-gl';
	import Switch from '../components/Switch.svelte';
	import { getEditorContext } from '../context';

	interface Props {
		/** the id of the switch */
		id: string;
	}

	let { id }: Props = $props();

	const context = getEditorContext();
	const { map, layer } = context;
	const heatmapLayerId = `${layer.id} heatmap`;

	let checked = $state(!!map.getLayer(heatmapLayerId));

	/** the heatmap layer, from the source and the filter of the layer */
	function createHeatmapLayer(): HeatmapLayerSpecification | undefined {
		if (!('source' in layer)) return;
		const heatmap: HeatmapLayerSpecification = {
			id: heatmapLayerId,
			type: 'heatmap',
			source: layer.source,
			layout: { visibility: 'visible' },
			paint: {
				'heatmap-color': [
					'interpolate',
					['linear'],
					['heatmap-density'],
					0,
					'rgba(0, 0, 255, 0)',
					0.1,
					'royalblue',
					0.3,
					'cyan',
					0.5,
					'lime',
					0.7,
					'yellow',
					1,
					'red'
				],
				'heatmap-intensity': 1,
				'heatmap-opacity': 1,
				'heatmap-radius': 30,
				'heatmap-weight': 1
			}
		};
		if ('source-layer' in layer && layer['source-layer']) {
			heatmap['source-layer'] = layer['source-layer'];
		}
		if ('filter' in layer && layer.filter) heatmap.filter = layer.filter;
		if (layer.minzoom !== undefined) heatmap.minzoom = layer.minzoom;
		if (layer.maxzoom !== undefined) heatmap.maxzoom = layer.maxzoom;
		return heatmap;
	}

	const toggle = (on: boolean) => {
		if (on && !map.getLayer(heatmapLayerId)) {
			const heatmap = createHeatmapLayer();
			if (heatmap) map.addLayer(heatmap, layer.id);
		} else if (!on && map.getLayer(heatmapLayerId)) {
			map.removeLayer(heatmapLayerId);
		}
		checked = !!map.getLayer(heatmapLayerId);
	};
</script>

<Switch {id} name="heatmap" bind:checked onchange={toggle} />
