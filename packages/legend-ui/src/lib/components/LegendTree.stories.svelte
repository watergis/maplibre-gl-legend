<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ModelFrame from '../../stories/ModelFrame.svelte';
	import { FLAT_GROUPS, MIXED_GROUPS, NESTED_GROUPS } from '../../stories/fixtures';
	import type { LegendPanelOptions } from '../types/legend-panel-options';
	import LegendTree from './LegendTree.svelte';

	const { Story } = defineMeta({
		title: 'Tree/LegendTree'
	});
</script>

{#snippet template(args: { options: LegendPanelOptions; hidden?: string[] })}
	<ModelFrame options={args.options} hidden={args.hidden}>
		{#snippet children(model)}
			<LegendTree {model} />
		{/snippet}
	</ModelFrame>
{/snippet}

<Story name="Layers" {template} args={{ options: { onlyRendered: false } }} />
<Story
	name="Flat groups"
	{template}
	args={{ options: { onlyRendered: false, groups: FLAT_GROUPS } }}
/>
<Story
	name="Nested groups"
	{template}
	args={{ options: { onlyRendered: false, groups: NESTED_GROUPS } }}
/>
<Story
	name="Layers and groups in a group"
	{template}
	args={{ options: { onlyRendered: false, groups: MIXED_GROUPS } }}
/>
<Story
	name="Grouped by source-layer"
	{template}
	args={{ options: { onlyRendered: false, groupBySourceLayer: true } }}
/>
<Story
	name="With style editor buttons"
	{template}
	args={{ options: { onlyRendered: false, groups: NESTED_GROUPS, showStyleEditor: true } }}
/>
<Story
	name="Without toggles"
	{template}
	args={{ options: { onlyRendered: false, groups: NESTED_GROUPS, showCheckbox: false } }}
/>
