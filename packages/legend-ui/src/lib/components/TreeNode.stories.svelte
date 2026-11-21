<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ModelFrame from '../../stories/ModelFrame.svelte';
	import { NESTED_GROUPS } from '../../stories/fixtures';
	import { findGroup, findLayer } from '../../stories/view';
	import TreeNode from './TreeNode.svelte';

	const { Story } = defineMeta({
		title: 'Tree/TreeNode'
	});
</script>

{#snippet template(args: { group?: string; layerId?: string })}
	<ModelFrame options={{ onlyRendered: false, groups: NESTED_GROUPS }}>
		{#snippet children(model)}
			<ul class="maplibregl-legend-tree">
				<TreeNode
					{model}
					node={args.group ? findGroup(model, args.group) : findLayer(model, args.layerId ?? '')}
				/>
			</ul>
		{/snippet}
	</ModelFrame>
{/snippet}

<Story name="Group" {template} args={{ group: 'Facilities' }} />
<Story name="Layer" {template} args={{ layerId: 'intake' }} />
