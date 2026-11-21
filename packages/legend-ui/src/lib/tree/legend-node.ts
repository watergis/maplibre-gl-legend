import type { LayerSpecification } from 'maplibre-gl';

/**
 * A node of the legend tree: a layer, or a group of nodes (layers and nested groups).
 * The tree has no DOM: it describes what the legend lists and in which order.
 */
export abstract class LegendNode {
	/** the group this node is listed in, or undefined at the top level */
	parent?: GroupNode;

	/** 0 at the top level, 1 in a top-level group, ... */
	get depth(): number {
		return this.parent ? this.parent.depth + 1 : 0;
	}

	/** the groups this node is listed in, from the top-level group to its parent */
	ancestors(): GroupNode[] {
		return this.parent ? [...this.parent.ancestors(), this.parent] : [];
	}

	/** the listed layers of this node: the layer itself, or all layers of a group including its nested groups */
	abstract layers(): LayerSpecification[];
}

/** A layer listed in the legend */
export class LayerNode extends LegendNode {
	readonly layer: LayerSpecification;

	constructor(layer: LayerSpecification) {
		super();
		this.layer = layer;
	}

	layers(): LayerSpecification[] {
		return [this.layer];
	}
}

/** A group of layers and nested groups */
export class GroupNode extends LegendNode {
	/** unique key of the group (from its titles, or its source and source-layer) */
	readonly key: string;
	/** the title shown in the group row */
	readonly title: string;
	/** true: grouped automatically by source-layer */
	readonly auto: boolean;
	/** the IDs of the layers switched by the group toggle, including the layers of its nested groups and the layers not listed */
	readonly toggleLayerIds: string[];
	readonly children: LegendNode[] = [];

	constructor(key: string, title: string, auto: boolean, toggleLayerIds: string[]) {
		super();
		this.key = key;
		this.title = title;
		this.auto = auto;
		this.toggleLayerIds = toggleLayerIds;
	}

	/** add a layer or a nested group at the end of the group */
	add(child: LegendNode): void {
		child.parent = this;
		this.children.push(child);
	}

	layers(): LayerSpecification[] {
		return this.children.flatMap((child) => child.layers());
	}
}
