<!--
@component
The eye toggle showing / hiding layers: checked when all of them are visible, partially checked
(indeterminate) when only some are visible. Clicking a partially visible toggle shows all layers.
-->
<script lang="ts">
	import type { LegendModel } from '../state/legend-model.svelte';

	interface Props {
		model: LegendModel;
		/** the layers switched by the toggle */
		layerIds: string[];
		/** the title of the layer or the group, for the accessible label */
		title: string;
		/** the name of the input: the layer ID of a layer row */
		name?: string;
		/** true: the toggle of a group (or of a group shown as a layer) */
		group?: boolean;
	}

	let { model, layerIds, title, name, group = false }: Props = $props();

	const toggle = $derived(model.toggleState(layerIds));
</script>

<input
	type="checkbox"
	class={['maplibregl-legend-visibility-toggle', group && 'maplibregl-legend-group-toggle']}
	{name}
	value={name}
	aria-label="Toggle visibility of {title}"
	title="Toggle visibility"
	{@attach (input) => {
		// set as properties: the browser changes them on click, before the model is updated
		input.checked = toggle === 'visible';
		input.indeterminate = toggle === 'partial';
	}}
	onclick={(e) => model.setLayersVisibility(layerIds, e.currentTarget.checked)}
/>
