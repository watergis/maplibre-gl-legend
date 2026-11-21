<!--
@component
A group of the legend tree: its title row (chevron, title, eye toggle switching all layers of the
group including its nested groups) and its rows, hidden while the group is collapsed. Groups are
nested to any depth. A group whose layers have nothing to draw is not listed.
-->
<script lang="ts">
	import type { LegendModel } from '../state/legend-model.svelte';
	import type { GroupView } from '../tree/legend-view';
	import TreeNode from './TreeNode.svelte';
	import TreeRow from './TreeRow.svelte';

	interface Props {
		model: LegendModel;
		node: GroupView;
	}

	let { model, node }: Props = $props();

	const hidden = $derived(node.layerIds.every((id) => model.hasNoLegend(id)));
	const collapsed = $derived(model.isCollapsed(node.key));
	const toggleCollapsed = () => model.setCollapsed(node.key, !collapsed);
</script>

{#if !hidden}
	<li class="maplibregl-legend-node maplibregl-legend-group" data-group={node.key}>
		<TreeRow
			{model}
			depth={node.depth}
			title={node.title}
			toggleLayerIds={node.toggleLayerIds}
			groupToggle
			header
			onrowclick={toggleCollapsed}
		>
			{#snippet lead()}
				<button
					type="button"
					class="maplibregl-legend-group-collapse"
					aria-expanded={!collapsed}
					aria-label="{collapsed ? 'Expand' : 'Collapse'} {node.title}"
					title={collapsed ? 'Expand' : 'Collapse'}
				></button>
			{/snippet}
		</TreeRow>
		{#if !collapsed}
			<ul class="maplibregl-legend-children">
				{#each node.children as child (child.key)}
					<TreeNode {model} node={child} />
				{/each}
			</ul>
		{/if}
	</li>
{/if}
