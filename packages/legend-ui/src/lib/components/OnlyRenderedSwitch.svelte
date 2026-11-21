<!--
@component
The "Only rendered" switch: a checkbox styled as a switch. When it is on, only the layers which have
features rendered in the current view are listed.
-->
<script lang="ts">
	import type { LegendModel } from '../state/legend-model.svelte';

	interface Props {
		model: LegendModel;
		/** the id of the checkbox, unique in the page */
		id: string;
	}

	let { model, id }: Props = $props();
</script>

<div class="maplibregl-legend-onlyRendered">
	<input
		type="checkbox"
		role="switch"
		{id}
		class="maplibregl-legend-onlyRendered-checkbox"
		checked={model.onlyRendered}
		onchange={(e) => model.setOnlyRendered(e.currentTarget.checked)}
	/>
	<label class="maplibregl-legend-onlyRendered-label" for={id}>
		{model.options.onlyRenderedLabel || 'Only rendered'}
	</label>
</div>
