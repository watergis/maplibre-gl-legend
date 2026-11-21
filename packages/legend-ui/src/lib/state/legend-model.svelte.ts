import type { LayerSpecification } from 'maplibre-gl';
import { GroupTreeBuilder } from '../tree/group-tree-builder';
import { buildLegendView, type LegendViewNode } from '../tree/legend-view';
import type { LegendPanelOptions, LegendTargets } from '../types/legend-panel-options';
import type { LayerSymbol, LegendSource } from '../types/legend-source';

/** the visibility of the layers switched by a toggle */
export type ToggleState = 'visible' | 'hidden' | 'partial';

/**
 * The state of the legend panel, kept between refreshes: the rows shown, the "Only rendered"
 * switch, the collapsed groups and the visibility of the layers. It has no DOM: the components
 * read it, and call its methods on user actions.
 */
export class LegendModel {
	/** the rows of the legend */
	view: LegendViewNode[] = $state.raw([]);
	/** the state of the "Only rendered" switch */
	onlyRendered: boolean = $state(true);

	/** collapsed state set by the user, by group key */
	private collapsed: Record<string, boolean> = $state({});
	/** visibility of the layers, by layer ID */
	private visible: Record<string, boolean> = $state({});
	/** layers which have no legend at the current view, by layer ID */
	private noLegend: Record<string, boolean> = $state({});
	/** legend symbols of the listed layers at the current view, by layer ID */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- replaced on refresh, read by the components when the rows change
	private symbols: Map<string, Promise<LayerSymbol>> = new Map();
	/** layers hidden with a toggle: they stay listed with "Only rendered", so that they can be shown again */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- only read on refresh
	private readonly keptHidden: Set<string> = new Set();

	readonly source: LegendSource;
	readonly targets: LegendTargets;
	readonly options: LegendPanelOptions;

	constructor(source: LegendSource, targets: LegendTargets, options: LegendPanelOptions = {}) {
		this.source = source;
		this.targets = targets;
		this.options = options;
		this.onlyRendered = options.onlyRendered ?? true;
	}

	/** whether a layer is listed in the legend (regardless of whether it is rendered) */
	isTarget(layerId: string): boolean {
		if (!this.targets || Object.keys(this.targets).length === 0) return true;
		return layerId in this.targets;
	}

	/** the title of a layer: its title in the targets, or its ID */
	titleOf(layer: LayerSpecification): string {
		return this.targets?.[layer.id] ?? layer.id;
	}

	/** read the layers, their visibility and the rendered layers from the source, and rebuild the rows */
	refresh(): void {
		let layers = this.source.getLayers();
		if (this.options.reverseOrder ?? true) layers = [...layers].reverse();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a local working copy
		const rendered = new Set(this.source.getRenderedLayerIds());

		const visible: Record<string, boolean> = {};
		for (const layer of layers) {
			visible[layer.id] = this.source.isLayerVisible(layer.id);
			if (rendered.has(layer.id)) {
				this.keptHidden.delete(layer.id);
			} else if (this.keptHidden.has(layer.id)) {
				// hidden by the toggle: keep it listed so that it can be shown again
				rendered.add(layer.id);
			}
		}
		this.visible = visible;

		const listed = layers.filter((l) => this.isTarget(l.id));
		const tree = new GroupTreeBuilder(this.options).build(listed, layers);
		const isShown = (l: LayerSpecification) => !this.onlyRendered || rendered.has(l.id);
		const view = buildLegendView(tree, isShown, (l) => this.titleOf(l));

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- see the field
		this.symbols = new Map();
		this.noLegend = {};
		const visit = (nodes: LegendViewNode[]) => {
			for (const node of nodes) {
				if (node.type === 'group') {
					visit(node.children);
					continue;
				}
				if (!visible[node.layer.id]) this.keptHidden.add(node.layer.id);
				const symbol = this.source
					.createSymbol(node.layer)
					.catch((): LayerSymbol => ({ type: 'error' }));
				this.symbols.set(node.layer.id, symbol);
				symbol.then((s) => {
					// ignore a symbol of a previous refresh
					if (s.type === 'none' && this.symbols.get(node.layer.id) === symbol) {
						this.noLegend = { ...this.noLegend, [node.layer.id]: true };
					}
				});
			}
		};
		visit(view);
		this.view = view;
	}

	/** switch the "Only rendered" switch, and rebuild the rows */
	setOnlyRendered(onlyRendered: boolean): void {
		this.onlyRendered = onlyRendered;
		this.refresh();
	}

	/** the legend symbol of a listed layer */
	symbol(layerId: string): Promise<LayerSymbol> {
		return this.symbols.get(layerId) ?? Promise.resolve({ type: 'none' });
	}

	/** whether a layer has no legend to show at the current view (known once its symbol is drawn) */
	hasNoLegend(layerId: string): boolean {
		return this.noLegend[layerId] === true;
	}

	isCollapsed(groupKey: string): boolean {
		return this.collapsed[groupKey] ?? this.options.collapseGroups ?? false;
	}

	setCollapsed(groupKey: string, collapsed: boolean): void {
		this.collapsed = { ...this.collapsed, [groupKey]: collapsed };
	}

	/** whether the layers are visible: all, none or some of them */
	toggleState(layerIds: string[]): ToggleState {
		const visibleCount = layerIds.filter((id) => this.visible[id] ?? true).length;
		if (visibleCount > 0 && visibleCount === layerIds.length) return 'visible';
		return visibleCount > 0 ? 'partial' : 'hidden';
	}

	/** show / hide layers (a partially visible group becomes visible) */
	setLayersVisibility(layerIds: string[], visible: boolean): void {
		this.source.setLayersVisibility(layerIds, visible);
		const next = { ...this.visible };
		for (const id of layerIds) {
			next[id] = visible;
			if (visible) this.keptHidden.delete(id);
			else this.keptHidden.add(id);
		}
		this.visible = next;
	}

	/** open the style editor of a layer */
	openStyleEditor(layerId: string, title: string): void {
		this.source.openStyleEditor?.(layerId, title);
	}
}
