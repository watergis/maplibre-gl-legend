import type { LayerSpecification } from 'maplibre-gl';
import { GroupNode, LayerNode, type LegendNode } from './legend-node';

/** A layer row of the legend */
export interface LayerView {
	type: 'layer';
	/** unique key of the row */
	key: string;
	layer: LayerSpecification;
	title: string;
	/** the level of the row in the tree: 0 at the top level */
	depth: number;
	/** the layers switched by the toggle of the row: the layer, or all layers of the group shown as this row */
	toggleLayerIds: string[];
	/** true: a group shown as this single layer row. Its toggle is partially checked when only some layers of the group are visible */
	group: boolean;
}

/** A group row of the legend, with its rows */
export interface GroupView {
	type: 'group';
	key: string;
	title: string;
	depth: number;
	/** the layers switched by the group toggle, including its nested groups and the layers not listed */
	toggleLayerIds: string[];
	/** the IDs of the layers listed in the group now, including its nested groups */
	layerIds: string[];
	children: LegendViewNode[];
}

/** A row of the legend: a layer, or a group with its rows */
export type LegendViewNode = LayerView | GroupView;

/**
 * Make the rows of the legend from the tree, with the layers shown now. At every level:
 *
 * - a layer not shown (e.g. not rendered with "Only rendered") is not listed
 * - a group without any layer shown is not listed
 * - a group of the `groups` option with only one listed layer (counting its nested groups) is
 *   shown as a single layer row, whose toggle switches all layers of the group. It stays a group
 *   when 2+ of its layers are listed, even if only one is shown now
 * - a source-layer group with only one layer shown is shown as a single layer row
 *
 * @param nodes the top-level nodes of the tree
 * @param isShown whether a listed layer is shown now
 * @param titleOf the title of a layer
 */
export function buildLegendView(
	nodes: LegendNode[],
	isShown: (layer: LayerSpecification) => boolean,
	titleOf: (layer: LayerSpecification) => string
): LegendViewNode[] {
	const layerView = (
		layer: LayerSpecification,
		depth: number,
		toggleLayerIds: string[],
		group: boolean
	): LayerView => ({
		type: 'layer',
		key: `layer:${layer.id}`,
		layer,
		title: titleOf(layer),
		depth,
		toggleLayerIds,
		group
	});

	const toView = (node: LegendNode): LegendViewNode | undefined => {
		if (node instanceof LayerNode) {
			return isShown(node.layer)
				? layerView(node.layer, node.depth, [node.layer.id], false)
				: undefined;
		}
		if (!(node instanceof GroupNode)) return undefined;

		const shownLayers = node.layers().filter(isShown);
		if (shownLayers.length === 0) return undefined;
		const single = node.auto ? shownLayers.length === 1 : node.layers().length === 1;
		if (single) {
			// an auto group shown as a layer switches the layer alone
			return node.auto
				? layerView(shownLayers[0], node.depth, [shownLayers[0].id], false)
				: layerView(shownLayers[0], node.depth, node.toggleLayerIds, true);
		}
		const children = node.children
			.map(toView)
			.filter((child): child is LegendViewNode => child !== undefined);
		return {
			type: 'group',
			key: node.key,
			title: node.title,
			depth: node.depth,
			toggleLayerIds: node.toggleLayerIds,
			layerIds: shownLayers.map((l) => l.id),
			children
		};
	};

	return nodes.map(toView).filter((node): node is LegendViewNode => node !== undefined);
}
