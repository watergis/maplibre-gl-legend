<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ModelFrame from '../../stories/ModelFrame.svelte';
	import { FLAT_GROUPS, NESTED_GROUPS } from '../../stories/fixtures';
	import { findGroup } from '../../stories/view';
	import type { LegendGroups } from '../types/legend-groups';
	import TreeGroup from './TreeGroup.svelte';

	const { Story } = defineMeta({
		title: 'Tree/TreeGroup'
	});

	interface Args {
		/** the groups option */
		groups: LegendGroups;
		/** the title of the group shown */
		title: string;
		collapseGroups?: boolean;
		hidden?: string[];
		showStyleEditor?: boolean;
	}
</script>

{#snippet template(args: Args)}
	<ModelFrame
		options={{
			onlyRendered: false,
			groups: args.groups,
			collapseGroups: args.collapseGroups,
			showStyleEditor: args.showStyleEditor
		}}
		hidden={args.hidden}
	>
		{#snippet children(model)}
			<ul class="maplibregl-legend-tree">
				<TreeGroup {model} node={findGroup(model, args.title)} />
			</ul>
		{/snippet}
	</ModelFrame>
{/snippet}

<Story name="Group of layers" {template} args={{ groups: FLAT_GROUPS, title: 'Pipeline' }} />
<Story
	name="Nested groups"
	{template}
	args={{ groups: NESTED_GROUPS, title: 'Water Supply', showStyleEditor: true }}
/>
<Story
	name="Collapsed"
	{template}
	args={{ groups: NESTED_GROUPS, title: 'Water Supply', collapseGroups: true }}
/>
<Story
	name="Partially visible"
	{template}
	args={{ groups: NESTED_GROUPS, title: 'Water Supply', hidden: ['tank', 'tank-point'] }}
/>
<Story
	name="Hidden"
	{template}
	args={{
		groups: FLAT_GROUPS,
		title: 'Pipeline',
		hidden: ['pipeline', 'pipeline-valve']
	}}
/>
