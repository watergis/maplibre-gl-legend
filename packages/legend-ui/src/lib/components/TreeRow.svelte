<!--
@component
A row of the legend tree:

    [indent][lead][label]......[style][eye]

`lead` is the chevron of a group or the symbol of a layer. The indent draws a vertical line under
the chevron of each group the row is in. The style column is shown with `showStyleEditor` (empty
when the row has no style button, e.g. a group), and the eye with `showCheckbox` at the right end,
so the eyes of all rows are aligned whether the row has a style button or not.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LegendModel } from '../state/legend-model.svelte';
	import VisibilityToggle from './VisibilityToggle.svelte';

	interface Props {
		model: LegendModel;
		/** the level of the row in the tree: 0 at the top level */
		depth: number;
		title: string;
		/** the chevron of a group, or the symbol of a layer */
		lead?: Snippet;
		/** the layers switched by the eye toggle */
		toggleLayerIds: string[];
		/** the name of the eye toggle: the layer ID of a layer row */
		toggleName?: string;
		/** true: the toggle switches a group */
		groupToggle?: boolean;
		/** the button in the style column */
		styleButton?: Snippet;
		/** true: the title row of a group */
		header?: boolean;
		/** called when the row is clicked outside the toggle and the style button */
		onrowclick?: () => void;
	}

	let {
		model,
		depth,
		title,
		lead,
		toggleLayerIds,
		toggleName,
		groupToggle = false,
		styleButton,
		header = false,
		onrowclick
	}: Props = $props();

	const showCheckbox = $derived(model.options.showCheckbox ?? true);
	const showStyleEditor = $derived(model.options.showStyleEditor ?? false);

	function handleClick(e: MouseEvent) {
		const target = e.target as Element | null;
		// the toggle and the buttons have their own actions
		if (target?.closest('input, .maplibregl-legend-style-slot')) return;
		onrowclick?.();
	}
</script>

<!-- the whole row of a group is clickable with the mouse; its chevron button is the keyboard equivalent -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	class={['maplibregl-legend-row', header && 'maplibregl-legend-group-header']}
	style:--maplibregl-legend-depth={depth}
	onclick={onrowclick ? handleClick : undefined}
>
	<span class="maplibregl-legend-indent" style:--maplibregl-legend-tree-levels={depth}></span>
	{@render lead?.()}
	<span class="maplibregl-legend-label">{title}</span>
	{#if showStyleEditor}
		<span class="maplibregl-legend-style-slot">{@render styleButton?.()}</span>
	{/if}
	{#if showCheckbox}
		<VisibilityToggle
			{model}
			layerIds={toggleLayerIds}
			{title}
			name={toggleName}
			group={groupToggle}
		/>
	{/if}
</div>
