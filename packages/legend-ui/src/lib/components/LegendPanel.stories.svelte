<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import LegendPanelFrame from '../../stories/LegendPanelFrame.svelte';
	import {
		FLAT_GROUPS,
		LAYERS,
		MIXED_GROUPS,
		NESTED_GROUPS,
		TARGETS
	} from '../../stories/fixtures';

	const { Story } = defineMeta({
		title: 'Panel/LegendPanel',
		component: LegendPanelFrame,
		args: {
			layers: LAYERS,
			targets: TARGETS,
			options: { onlyRendered: false },
			onstyleeditor: fn()
		}
	});
</script>

<Story name="Layers" />
<Story name="Flat groups" args={{ options: { onlyRendered: false, groups: FLAT_GROUPS } }} />
<Story
	name="Nested groups"
	args={{ options: { onlyRendered: false, groups: NESTED_GROUPS, showStyleEditor: true } }}
/>
<Story
	name="Layers and groups in a group"
	args={{ options: { onlyRendered: false, groups: MIXED_GROUPS } }}
/>
<Story
	name="Partially visible group"
	args={{
		options: { onlyRendered: false, groups: NESTED_GROUPS },
		hidden: ['tank', 'tank-point']
	}}
/>
<Story
	name="Collapsed groups"
	args={{ options: { onlyRendered: false, groups: NESTED_GROUPS, collapseGroups: true } }}
/>
<Story
	name="Grouped by source-layer"
	args={{ options: { onlyRendered: false, groupBySourceLayer: true } }}
/>
<Story
	name="Only rendered"
	args={{
		options: { onlyRendered: true, groups: NESTED_GROUPS },
		rendered: ['village', 'pipeline', 'wtp', 'wtp-point']
	}}
/>
<Story
	name="Without toggles"
	args={{ options: { onlyRendered: false, groups: NESTED_GROUPS, showCheckbox: false } }}
/>
