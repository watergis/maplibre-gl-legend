import type { LayerSpecification } from 'maplibre-gl';
import type { LegendGroups } from '../types/legend-groups';
import { GroupNode, LayerNode, type LegendNode } from './legend-node';

/** the options used to build the tree */
export interface GroupTreeOptions {
	groups?: LegendGroups;
	groupBySourceLayer?: boolean;
}

/**
 * the key of a group from its titles, from the top-level group: nested groups of the same title
 * in different groups are different groups
 */
const groupKey = (path: string[]): string =>
	path.length === 1 ? `group:${path[0]}` : `group:${JSON.stringify(path)}`;

const isGroups = (value: unknown): value is LegendGroups =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Builds the legend tree from the layers and the group options: the groups of the `groups` option
 * (nested to any depth), then the layers sharing source and source-layer with
 * `groupBySourceLayer`.
 *
 * A group is placed at the position of its first listed layer, at every level.
 */
export class GroupTreeBuilder {
	private readonly options: GroupTreeOptions;

	constructor(options: GroupTreeOptions) {
		this.options = options;
	}

	/**
	 * @param listedLayers layers in the order shown in the legend
	 * @param allLayers all layers of the style in the same order, including the layers not listed
	 * @returns the top-level nodes of the legend
	 */
	build(listedLayers: LayerSpecification[], allLayers: LayerSpecification[]): LegendNode[] {
		// the group (key) each layer belongs to
		const owners: Map<string, string> = new Map();
		// the parent group (key) of each nested group
		const parents: Map<string, string> = new Map();
		const titles: Map<string, string> = new Map();
		const autoKeys: Set<string> = new Set();
		// the layers switched by each group toggle
		const toggleLayerIds: Map<string, string[]> = new Map();

		this.resolveGroups(allLayers, owners, parents, titles);

		// membership is decided over all layers of the style, so a layer not listed is still switched by its groups
		for (const layer of allLayers) {
			for (let key = owners.get(layer.id); key !== undefined; key = parents.get(key)) {
				toggleLayerIds.set(key, [...(toggleLayerIds.get(key) ?? []), layer.id]);
			}
		}

		if (this.options.groupBySourceLayer) {
			for (const [key, { title, members }] of this.sourceLayerGroups(listedLayers, owners)) {
				// a source-layer used by only one layer is not grouped
				if (members.length < 2) continue;
				for (const layer of members) owners.set(layer.id, key);
				autoKeys.add(key);
				titles.set(key, title);
				// an auto group switches its listed layers only
				toggleLayerIds.set(
					key,
					members.map((l) => l.id)
				);
			}
		}

		const roots: LegendNode[] = [];
		const groups: Map<string, GroupNode> = new Map();
		const getGroup = (key: string): GroupNode => {
			const existing = groups.get(key);
			if (existing) return existing;
			const group = new GroupNode(
				key,
				titles.get(key) ?? key,
				autoKeys.has(key),
				toggleLayerIds.get(key) ?? []
			);
			groups.set(key, group);
			// the parent is created (and placed) first, so a nested group comes at the position of its first listed layer
			const parent = parents.get(key);
			if (parent === undefined) roots.push(group);
			else getGroup(parent).add(group);
			return group;
		};

		for (const layer of listedLayers) {
			const node = new LayerNode(layer);
			const owner = owners.get(layer.id);
			if (owner === undefined) roots.push(node);
			else getGroup(owner).add(node);
		}
		return roots;
	}

	/**
	 * resolve the groups option (nested to any depth): the group of each layer and the parent of
	 * each nested group. A layer belongs to the first group listing it
	 */
	private resolveGroups(
		allLayers: LayerSpecification[],
		owners: Map<string, string>,
		parents: Map<string, string>,
		titles: Map<string, string>
	): void {
		const styleLayerIds = new Set(allLayers.map((l) => l.id));
		// the group objects being resolved, so that an object nested in itself does not loop forever
		const resolving: Set<object> = new Set();

		const resolve = (groups: LegendGroups, path: string[], parentKey?: string) => {
			if (resolving.has(groups)) return;
			resolving.add(groups);
			for (const [title, members] of Object.entries(groups)) {
				const groupPath = [...path, title];
				const key = groupKey(groupPath);
				titles.set(key, title);
				if (parentKey !== undefined) parents.set(key, parentKey);
				const list = Array.isArray(members) ? members : isGroups(members) ? [members] : [];
				for (const member of list) {
					if (typeof member === 'string') {
						if (styleLayerIds.has(member) && !owners.has(member)) owners.set(member, key);
					} else if (isGroups(member)) {
						resolve(member, groupPath, key);
					}
				}
			}
			resolving.delete(groups);
		};
		resolve(this.options.groups ?? {}, []);
	}

	/** the listed layers not in the groups option, by source and source-layer, titled by the source-layer */
	private sourceLayerGroups(
		listedLayers: LayerSpecification[],
		owners: Map<string, string>
	): Map<string, { title: string; members: LayerSpecification[] }> {
		const result: Map<string, { title: string; members: LayerSpecification[] }> = new Map();
		for (const layer of listedLayers) {
			if (owners.has(layer.id)) continue;
			const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;
			if (!sourceLayer || !('source' in layer)) continue;
			const key = `source-layer:${layer.source}/${sourceLayer}`;
			const group = result.get(key) ?? { title: sourceLayer, members: [] };
			group.members.push(layer);
			result.set(key, group);
		}
		return result;
	}
}
