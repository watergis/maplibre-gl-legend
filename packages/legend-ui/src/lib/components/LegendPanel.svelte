<!--
@component
The legend panel: a close button, the title, the "Only rendered" switch, and the tree of layers and
groups. It is shown in a MapLibre control (`.maplibregl-ctrl.maplibregl-ctrl-group`).

Its styles are in `legend.css`, with the class names of maplibre-gl-legend: override the
`--maplibregl-legend-*` custom properties on `.maplibregl-legend-list` to restyle it.
-->
<script lang="ts">
	import '../legend.css';
	import type { LegendModel } from '../state/legend-model.svelte';
	import LegendTree from './LegendTree.svelte';
	import OnlyRenderedSwitch from './OnlyRenderedSwitch.svelte';

	interface Props {
		model: LegendModel;
		/** whether the panel is shown */
		open?: boolean;
		/** called when the close button is clicked */
		onclose?: () => void;
		/** prefix of the ids of the form elements, unique in the page */
		idPrefix?: string;
	}

	let { model, open = true, onclose, idPrefix = 'maplibregl-legend' }: Props = $props();

	let root: HTMLElement | undefined = $state();

	/**
	 * Whether a node is in the panel, e.g. to ignore the clicks in the panel.
	 *
	 * @param node the node
	 */
	export function contains(node: Node | null): boolean {
		return !!node && !!root?.contains(node);
	}
</script>

<div class="maplibregl-legend-list" style:display={open ? 'block' : 'none'} bind:this={root}>
	<button
		type="button"
		class="maplibregl-legend-close-button"
		aria-label="Close legend"
		title="Close"
		onclick={() => onclose?.()}
	></button>
	<div class="maplibregl-legend-title-label">{model.options.title || 'Legend'}</div>
	<OnlyRenderedSwitch {model} id="{idPrefix}-onlyrendered" />
	<div class="maplibregl-legend-table-wrapper">
		<LegendTree {model} />
	</div>
</div>
