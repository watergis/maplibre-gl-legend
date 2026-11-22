/*
 * Internal UI of maplibre-gl-legend: the legend panel, with the tree of layers and groups nested to
 * any depth. It is bundled into the plugin and not published.
 */
export { LegendPanel, type LegendPanelMountOptions } from './legend-panel.svelte';
export { LegendModel, type ToggleState } from './state/legend-model.svelte';
export { GroupTreeBuilder, type GroupTreeOptions } from './tree/group-tree-builder';
export { GroupNode, LayerNode, LegendNode } from './tree/legend-node';
export {
	buildLegendView,
	type GroupView,
	type LayerView,
	type LegendViewNode
} from './tree/legend-view';
export type { LegendGroupMembers, LegendGroups } from './types/legend-groups';
export type { LegendPanelOptions, LegendTargets } from './types/legend-panel-options';
export type { LayerSymbol, LegendClass, LegendSource } from './types/legend-source';

export { default as LegendPanelComponent } from './components/LegendPanel.svelte';
export { default as LegendTree } from './components/LegendTree.svelte';
export { default as OnlyRenderedSwitch } from './components/OnlyRenderedSwitch.svelte';
export { default as TreeGroup } from './components/TreeGroup.svelte';
export { default as TreeLayer } from './components/TreeLayer.svelte';
export { default as TreeNode } from './components/TreeNode.svelte';
export { default as TreeRow } from './components/TreeRow.svelte';
export { default as VisibilityToggle } from './components/VisibilityToggle.svelte';
export { default as LayerSymbolView } from './components/LayerSymbol.svelte';
