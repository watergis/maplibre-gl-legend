import type { LegendModel } from '../lib/state/legend-model.svelte';
import type { GroupView, LayerView, LegendViewNode } from '../lib/tree/legend-view';

/** all rows of the legend, depth first */
function rows(nodes: LegendViewNode[]): LegendViewNode[] {
	return nodes.flatMap((node) => (node.type === 'group' ? [node, ...rows(node.children)] : [node]));
}

/** the group row of a title in the legend of a model */
export function findGroup(model: LegendModel, title: string): GroupView {
	const group = rows(model.view).find(
		(node): node is GroupView => node.type === 'group' && node.title === title
	);
	if (!group) throw new Error(`no group "${title}" in the legend`);
	return group;
}

/** the row of a layer in the legend of a model */
export function findLayer(model: LegendModel, layerId: string): LayerView {
	const layer = rows(model.view).find(
		(node): node is LayerView => node.type === 'layer' && node.layer.id === layerId
	);
	if (!layer) throw new Error(`no layer "${layerId}" in the legend`);
	return layer;
}
