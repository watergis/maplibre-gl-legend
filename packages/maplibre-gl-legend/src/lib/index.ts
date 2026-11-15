import { ControlPosition, IControl, LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';
import { createLayerLegend, createLegendCache, legendToSvg } from '@watergis/maplibre2svg';

export interface LegendOptions {
	showDefault: boolean;
	showCheckbox: boolean;
	reverseOrder: boolean;
	onlyRendered: boolean;
	title?: string;
	onlyRenderedLabel?: string;
	/**
	 * Groups of layers shown (and switched on/off) together: group title and the layer IDs in it.
	 * A layer belongs to the first group listing it.
	 */
	groups?: { [title: string]: string[] };
	/** Layers not in `groups` which share the same source and source-layer are grouped by the source-layer name. Default is true. */
	groupBySourceLayer?: boolean;
	/** true: groups are collapsed as default. Default is false. */
	collapseGroups?: boolean;
}

/** a row of the legend: a single layer, or a group of layers */
type LegendItem =
	| { type: 'layer'; layer: LayerSpecification }
	| {
			type: 'group';
			key: string;
			title: string;
			layers: LayerSpecification[];
			/** true: grouped automatically by source-layer */
			auto: boolean;
	  };

/**
 * Mapbox GL Legend Control.
 * @param {Object} targets - Object of layer.id and title
 * @param {boolean} options.showDefault true: it shows legend as default. false: legend will be closed as default
 * @param {boolean} options.showCheckbox true: checkbox will be added for switching layer's visibility. false: checkbox will not be added.
 * @param {boolean} options.reverseOrder true: layers will be ordered from top. false: layers will be ordered from bottom. If not specified, default value will be true.
 * @param {boolean} options.onlyRendered true: only rendered layers will be shown on legend as default. false: all layers' legend will be shown as default. If not specified, default value will be true.
 * @param {string} options.title the text shown above the legend. Default is 'Legend'.
 * @param {string} options.onlyRenderedLabel the text of the "Only rendered" checkbox label. Default is 'Only rendered'.
 * @param {Object} options.groups groups of layers shown and switched on/off together: group title and the layer IDs in it.
 * @param {boolean} options.groupBySourceLayer true: layers sharing the same source-layer are grouped. Default is true.
 * @param {boolean} options.collapseGroups true: groups are collapsed as default. Default is false.
 */

export class MaplibreLegendControl implements IControl {
	private controlContainer: HTMLElement;
	private map?: MaplibreMap;
	private legendContainer: HTMLElement;
	private legendButton: HTMLButtonElement;
	private closeButton: HTMLButtonElement;
	private legendTable: HTMLElement;
	private targets: { [key: string]: string };
	private uncheckedLayers: { [key: string]: string } = {};
	private onlyRendered: boolean;
	private options: LegendOptions = {
		showDefault: true,
		showCheckbox: true,
		reverseOrder: true,
		onlyRendered: true,
		title: undefined,
		onlyRenderedLabel: undefined,
		groups: undefined,
		groupBySourceLayer: true,
		collapseGroups: false
	};
	// keeps the glyphs and tiles loaded for the legend between redraws
	private legendCache = createLegendCache();
	// collapsed state of each group (by group key), kept between redraws
	private collapsedGroups: Map<string, boolean> = new Map();
	// layer IDs of each group (by group key) in the current legend
	private groupLayers: Map<string, string[]> = new Map();
	private redrawScheduled = false;

	constructor(targets: { [key: string]: string }, options?: Partial<LegendOptions>) {
		this.targets = targets;
		if (options) {
			this.options = Object.assign(this.options, options);
		}
		this.onlyRendered = this.options.onlyRendered;
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	public getDefaultPosition(): ControlPosition {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	private isLayerVisible(layerId: string): boolean {
		return this.map?.getLayoutProperty(layerId, 'visibility') !== 'none';
	}

	/**
	 * switch a layer's visibility, and update its checkboxes
	 * @param layerId layer ID
	 * @param visible true: show the layer. false: hide the layer
	 */
	private setLayerVisibility(layerId: string, visible: boolean) {
		if (visible) {
			if (this.uncheckedLayers[layerId]) delete this.uncheckedLayers[layerId];
			this.map?.setLayoutProperty(layerId, 'visibility', 'visible');
		} else {
			this.uncheckedLayers[layerId] = layerId;
			this.map?.setLayoutProperty(layerId, 'visibility', 'none');
		}
		// a layer can be shown in other legend controls too
		document.getElementsByName(layerId).forEach((checkbox) => {
			if (checkbox instanceof HTMLInputElement) checkbox.checked = visible;
		});
	}

	/**
	 * create checkbox for switching layer visibility
	 * @param layer mapboxgl.Layer object
	 * @returns HTMLElement | undefined return TD Element
	 */
	private createLayerCheckbox(layer: LayerSpecification): HTMLElement | undefined {
		if (!this.options.showCheckbox) return;

		// create checkbox for switching layer visibility
		const td = document.createElement('TD');
		td.className = 'legend-table-td';
		const checklayer = document.createElement('input');
		checklayer.setAttribute('type', 'checkbox');
		checklayer.setAttribute('name', layer.id);
		checklayer.setAttribute('value', layer.id);
		checklayer.classList.add('maplibregl-legend-visibility-toggle');
		const layerTitle = this.targets?.[layer.id] ?? layer.id;
		checklayer.setAttribute('aria-label', `Toggle visibility of ${layerTitle}`);
		checklayer.title = 'Toggle visibility';
		const visible = this.isLayerVisible(layer.id);
		checklayer.checked = visible;
		if (!visible) this.uncheckedLayers[layer.id] = layer.id;

		checklayer.addEventListener('click', () => {
			this.setLayerVisibility(layer.id, checklayer.checked);
			this.updateGroupStates();
			this.redrawWhenIdle();
		});
		td.appendChild(checklayer);

		return td;
	}

	/**
	 * Create and return a layer's legend rows
	 * @param layer mapboxgl.Layer object
	 * @param groupKey the key of the group the layer belongs to
	 * @returns the TBODY Element holding the layer's rows, and a promise resolved with false when the layer has no legend (the TBODY is removed)
	 */
	private getLayerLegend(
		layer: LayerSpecification,
		groupKey?: string
	): { tbody: HTMLElement; ready: Promise<boolean> } | undefined {
		const map = this.map;
		if (!map) return;

		// all rows of a layer (the layer row and its class row) share a tbody, so they are separated from other layers as a group
		const tbody = document.createElement('TBODY');
		tbody.className = 'maplibregl-legend-layer';
		if (groupKey !== undefined) {
			tbody.classList.add('maplibregl-legend-group-member');
			tbody.dataset.group = groupKey;
		}
		const tr = document.createElement('TR');
		tbody.appendChild(tr);

		const td0 = this.createLayerCheckbox(layer);
		if (td0) tr.appendChild(td0);

		// create legend symbol
		const td1 = document.createElement('TD');
		td1.className = 'legend-table-td';

		const appendFallbackIcon = () => {
			const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			const iconPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');

			iconSvg.setAttribute('fill', 'none');
			iconSvg.setAttribute('viewBox', '0 0 24 24');
			iconSvg.setAttribute('stroke', 'black');
			iconSvg.classList.add('post-icon');

			iconPath.setAttribute(
				'd',
				'M21,0H3A3,3,0,0,0,0,3V21a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V3A3,3,0,0,0,21,0ZM3,2H21a1,1,0,0,1,1,1V15.86L14.18,9.35a5.06,5.06,0,0,0-6.39-.06L2,13.92V3A1,1,0,0,1,3,2ZM21,22H3a1,1,0,0,1-1-1V16.48l7-5.63a3.06,3.06,0,0,1,3.86,0L22,18.47V21A1,1,0,0,1,21,22Z'
			);

			iconPath.setAttribute('stroke-linecap', 'round');
			iconPath.setAttribute('stroke-linejoin', 'round');
			iconPath.setAttribute('stroke-width', '2');

			iconPath2.setAttribute(
				'd',
				'M18,9a3,3,0,1,0-3-3A3,3,0,0,0,18,9Zm0-4a1,1,0,1,1-1,1A1,1,0,0,1,18,5Z'
			);
			iconPath2.setAttribute('stroke-linecap', 'round');
			iconPath2.setAttribute('stroke-linejoin', 'round');
			iconPath2.setAttribute('stroke-width', '2');

			iconSvg.appendChild(iconPath);
			iconSvg.appendChild(iconPath2);

			td1.appendChild(iconSvg);
		};

		// create layer label
		const td2 = document.createElement('TD');
		td2.className = 'legend-table-td';
		const label1 = document.createElement('label');
		label1.textContent = this.targets && this.targets[layer.id] ? this.targets[layer.id] : layer.id;
		td2.appendChild(label1);

		// draw the legend symbol(s) with maplibre2svg; the row is shown first and filled when ready
		const ready = createLayerLegend(layer, map.getStyle(), {
			zoom: map.getZoom(),
			center: map.getCenter().toArray(),
			getImage: (id) => {
				const image = map.getImage(id);
				const rgba = image?.data;
				if (!rgba || !('data' in rgba)) return undefined;
				return {
					data: rgba.data,
					width: rgba.width,
					height: rgba.height,
					pixelRatio: image.pixelRatio,
					sdf: image.sdf
				};
			},
			listImages: () => map.listImages(),
			cache: this.legendCache
		})
			.then((legend) => {
				if (legend.entries.length === 0) {
					tbody.remove();
					return false;
				} else if (legend.entries.length === 1) {
					td1.appendChild(legend.entries[0].svg);
				} else {
					// a classified layer: its classes (symbol and label) in a row of their own under the layer row
					const trClasses = document.createElement('TR');
					const tdClasses = document.createElement('td');
					tdClasses.className = 'legend-table-td';
					tdClasses.colSpan = tr.children.length;
					tdClasses.appendChild(legendToSvg([legend], { titles: 'never' }));
					trClasses.appendChild(tdClasses);
					tr.after(trClasses);
					// the layer row has no symbol: the label right after the checkbox
					td1.remove();
					td2.setAttribute('colspan', '2');
				}
				return true;
			})
			.catch(() => {
				appendFallbackIcon();
				return true;
			});

		tr.appendChild(td1);
		tr.appendChild(td2);
		return { tbody, ready };
	}

	/**
	 * create the header row of a group: a checkbox switching all layers of the group, a button to collapse the group, and its title
	 * @param item the group
	 * @returns HTMLElement return TBODY Element holding the header row
	 */
	private createGroupHeader(item: Extract<LegendItem, { type: 'group' }>): HTMLElement {
		const tbody = document.createElement('TBODY');
		tbody.className = 'maplibregl-legend-group';
		tbody.dataset.group = item.key;
		const tr = document.createElement('TR');
		tbody.appendChild(tr);

		if (this.options.showCheckbox) {
			const td0 = document.createElement('TD');
			td0.className = 'legend-table-td';
			const checkbox = document.createElement('input');
			checkbox.setAttribute('type', 'checkbox');
			checkbox.classList.add('maplibregl-legend-visibility-toggle');
			checkbox.classList.add('maplibregl-legend-group-toggle');
			checkbox.setAttribute('aria-label', `Toggle visibility of ${item.title}`);
			checkbox.title = 'Toggle visibility';
			checkbox.addEventListener('click', () => {
				// a partially visible group becomes visible
				const visible = checkbox.checked;
				for (const layer of item.layers) {
					this.setLayerVisibility(layer.id, visible);
				}
				this.updateGroupStates();
				this.redrawWhenIdle();
			});
			td0.appendChild(checkbox);
			tr.appendChild(td0);
		}

		// the title spans the symbol and label columns, with the collapse button at its right end
		const td1 = document.createElement('TD');
		td1.className = 'legend-table-td';
		td1.setAttribute('colspan', '2');
		const titleContainer = document.createElement('div');
		titleContainer.className = 'maplibregl-legend-group-title';
		const label = document.createElement('label');
		label.textContent = item.title;
		titleContainer.appendChild(label);
		const collapseButton = document.createElement('button');
		collapseButton.type = 'button';
		collapseButton.classList.add('maplibregl-legend-group-collapse');
		const setCollapsed = (collapsed: boolean) => {
			this.collapsedGroups.set(item.key, collapsed);
			collapseButton.setAttribute('aria-expanded', String(!collapsed));
			collapseButton.setAttribute(
				'aria-label',
				`${collapsed ? 'Expand' : 'Collapse'} ${item.title}`
			);
			collapseButton.title = collapsed ? 'Expand' : 'Collapse';
			for (const member of this.getGroupMembers(item.key)) {
				member.hidden = collapsed;
			}
		};
		// clicking anywhere on the group row (title, button or empty space) expands / collapses the group, except the visibility toggle
		tr.classList.add('maplibregl-legend-group-header');
		tr.addEventListener('click', (e) => {
			if (e.target instanceof HTMLInputElement) return;
			setCollapsed(!this.isGroupCollapsed(item.key));
		});
		titleContainer.appendChild(collapseButton);
		td1.appendChild(titleContainer);
		tr.appendChild(td1);

		// the attributes of the button are set here, the members are hidden after they are added
		setCollapsed(this.isGroupCollapsed(item.key));
		return tbody;
	}

	/**
	 * redraw the legend after the map is rendered, so that layers just shown are listed as rendered layers
	 */
	private redrawWhenIdle() {
		const map = this.map;
		if (!map || this.redrawScheduled) return;
		this.redrawScheduled = true;
		map.once('idle', () => {
			this.redrawScheduled = false;
			this.updateLegendControl();
		});
	}

	private isGroupCollapsed(key: string): boolean {
		return this.collapsedGroups.get(key) ?? this.options.collapseGroups ?? false;
	}

	/** the TBODY Elements of the layers in a group */
	private getGroupMembers(key: string): HTMLElement[] {
		if (!this.legendTable) return [];
		return Array.from(this.legendTable.children).filter(
			(el): el is HTMLElement =>
				el instanceof HTMLElement &&
				el.classList.contains('maplibregl-legend-group-member') &&
				el.dataset.group === key
		);
	}

	/** update the group checkboxes from the visibility of their layers: checked, unchecked, or indeterminate (partially visible) */
	private updateGroupStates() {
		if (!this.legendTable) return;
		for (const el of Array.from(this.legendTable.children)) {
			if (!(el instanceof HTMLElement) || !el.classList.contains('maplibregl-legend-group'))
				continue;
			const checkbox = el.querySelector('input.maplibregl-legend-group-toggle');
			if (!(checkbox instanceof HTMLInputElement)) continue;
			const layerIds = this.groupLayers.get(el.dataset.group ?? '') ?? [];
			const visibleCount = layerIds.filter((id) => this.isLayerVisible(id)).length;
			checkbox.checked = visibleCount > 0 && visibleCount === layerIds.length;
			checkbox.indeterminate = visibleCount > 0 && visibleCount < layerIds.length;
		}
	}

	/** whether a layer is shown in the legend (regardless of whether it is rendered) */
	private isTarget(layerId: string): boolean {
		if (this.targets === undefined || Object.keys(this.targets).length === 0) return true;
		if (layerId in this.targets) return true;
		// layers in the groups are shown even if they are not in the targets
		return Object.values(this.options.groups ?? {}).some((ids) => ids.includes(layerId));
	}

	/**
	 * put layers into groups: the groups in the options first, then layers sharing source and source-layer
	 * @param layers layers in the order shown in the legend
	 * @returns the rows of the legend. A group is placed at the position of its first layer
	 */
	private createLegendItems(layers: LayerSpecification[]): LegendItem[] {
		const groupKeys: Map<string, string> = new Map();
		const titles: Map<string, string> = new Map();
		const layerIds = new Set(layers.map((l) => l.id));

		for (const [title, ids] of Object.entries(this.options.groups ?? {})) {
			const key = `group:${title}`;
			for (const id of ids) {
				if (!layerIds.has(id) || groupKeys.has(id)) continue;
				groupKeys.set(id, key);
				titles.set(key, title);
			}
		}

		if (this.options.groupBySourceLayer !== false) {
			const sourceLayerGroups: Map<string, LayerSpecification[]> = new Map();
			for (const layer of layers) {
				if (groupKeys.has(layer.id)) continue;
				const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;
				if (!sourceLayer || !('source' in layer)) continue;
				const key = `source-layer:${layer.source}/${sourceLayer}`;
				sourceLayerGroups.set(key, [...(sourceLayerGroups.get(key) ?? []), layer]);
				titles.set(key, sourceLayer);
			}
			for (const [key, members] of sourceLayerGroups) {
				// a source-layer used by only one layer is not grouped
				if (members.length < 2) continue;
				for (const layer of members) groupKeys.set(layer.id, key);
			}
		}

		const items: LegendItem[] = [];
		const groups: Map<string, Extract<LegendItem, { type: 'group' }>> = new Map();
		for (const layer of layers) {
			const key = groupKeys.get(layer.id);
			if (key === undefined) {
				items.push({ type: 'layer', layer });
				continue;
			}
			let group = groups.get(key);
			if (!group) {
				group = {
					type: 'group',
					key,
					title: titles.get(key) ?? key,
					layers: [],
					auto: key.startsWith('source-layer:')
				};
				groups.set(key, group);
				items.push(group);
			}
			group.layers.push(layer);
		}
		return items;
	}

	/**
	 * update legend contents
	 */
	private updateLegendControl() {
		const map = this.map;

		// get current rendered layers
		const visibleLayers = {};
		if (map) {
			const features = map.queryRenderedFeatures();
			for (const feature of features) {
				visibleLayers[feature.layer.id] = feature.layer;
			}
		}

		let layers = map?.getStyle().layers;
		if (!layers) return;

		if (!this.legendTable) {
			this.legendTable = document.createElement('TABLE');
			this.legendTable.className = 'legend-table';
			// only the table scrolls, so the scrollbar does not overlap the close button
			const tableWrapper = document.createElement('div');
			tableWrapper.className = 'maplibregl-legend-table-wrapper';
			tableWrapper.appendChild(this.legendTable);
			this.legendContainer.appendChild(tableWrapper);
		}

		while (this.legendTable.firstChild) {
			this.legendTable.removeChild(this.legendTable.firstChild);
		}
		if (this.options.reverseOrder) {
			layers = layers.reverse();
		}

		const targetLayers = layers.filter((l) => {
			if (visibleLayers[l.id] && this.uncheckedLayers[l.id]) {
				delete this.uncheckedLayers[l.id];
			} else if (this.uncheckedLayers[l.id]) {
				// hidden by the checkbox: keep it in the legend so that it can be shown again
				visibleLayers[l.id] = l;
			}
			return this.isTarget(l.id);
		});
		// with onlyRendered, only rendered layers are listed
		const isShown = (l: LayerSpecification) => !this.onlyRendered || !!visibleLayers[l.id];

		this.groupLayers = new Map();
		for (const item of this.createLegendItems(targetLayers)) {
			if (item.type === 'layer') {
				if (!isShown(item.layer)) continue;
				const legend = this.getLayerLegend(item.layer);
				if (legend) this.legendTable.appendChild(legend.tbody);
				continue;
			}

			const shownLayers = item.layers.filter(isShown);
			if (shownLayers.length === 0) continue;
			if (item.auto && shownLayers.length < 2) {
				// a source-layer group with only one layer listed now (e.g. its other layers are not rendered at this zoom) is shown as a single layer
				const legend = this.getLayerLegend(shownLayers[0]);
				if (legend) this.legendTable.appendChild(legend.tbody);
				continue;
			}
			// the group checkbox switches all layers of the group, including layers not rendered now
			this.groupLayers.set(
				item.key,
				item.layers.map((l) => l.id)
			);
			const header = this.createGroupHeader(item);
			this.legendTable.appendChild(header);
			const collapsed = this.isGroupCollapsed(item.key);
			const ready: Promise<boolean>[] = [];
			for (const layer of shownLayers) {
				const legend = this.getLayerLegend(layer, item.key);
				if (!legend) continue;
				legend.tbody.hidden = collapsed;
				this.legendTable.appendChild(legend.tbody);
				ready.push(legend.ready);
			}
			// remove the group when none of its layers has a legend
			Promise.all(ready).then((results) => {
				if (!results.some((r) => r)) header.remove();
			});
		}
		this.updateGroupStates();
	}

	public onAdd(map: MaplibreMap): HTMLElement {
		this.map = map;
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add('maplibregl-ctrl');
		this.controlContainer.classList.add('maplibregl-ctrl-group');
		this.legendContainer = document.createElement('div');
		this.legendContainer.classList.add('maplibregl-legend-list');
		this.legendButton = document.createElement('button');
		this.legendButton.classList.add('maplibregl-ctrl-icon');
		this.legendButton.classList.add('maplibregl-legend-switcher');
		this.legendButton.addEventListener('click', () => {
			this.legendButton.style.display = 'none';
			this.legendContainer.style.display = 'block';
		});
		document.addEventListener('click', this.onDocumentClick);
		this.controlContainer.appendChild(this.legendButton);
		this.controlContainer.appendChild(this.legendContainer);

		// the icon is drawn by CSS (.maplibregl-legend-close-button::before)
		this.closeButton = document.createElement('button');
		this.closeButton.type = 'button';
		this.closeButton.setAttribute('aria-label', 'Close legend');
		this.closeButton.title = 'Close';
		this.closeButton.classList.add('maplibregl-legend-close-button');
		this.closeButton.addEventListener('click', () => {
			this.legendButton.style.display = 'block';
			this.legendContainer.style.display = 'none';
		});
		this.legendContainer.appendChild(this.closeButton);

		const legendLabel = document.createElement('label');
		legendLabel.classList.add('maplibregl-legend-title-label');
		legendLabel.textContent = this.options.title || 'Legend';
		this.legendContainer.appendChild(legendLabel);

		// "Only rendered" switch: a checkbox styled as a switch by CSS
		const onlyRenderedContainer = document.createElement('div');
		onlyRenderedContainer.classList.add('maplibregl-legend-onlyRendered');
		const checkOnlyRendered = document.createElement('input');
		checkOnlyRendered.setAttribute('type', 'checkbox');
		checkOnlyRendered.setAttribute('role', 'switch');
		const checkboxOnlyRenderedId = `maplibregl-legend-onlyrendered-checkbox-${Math.random() * 100}`;
		checkOnlyRendered.setAttribute('id', checkboxOnlyRenderedId);
		checkOnlyRendered.classList.add('maplibregl-legend-onlyRendered-checkbox');
		checkOnlyRendered.checked = this.onlyRendered;
		checkOnlyRendered.addEventListener('click', this.handleClickOnlyRendered.bind(this));
		onlyRenderedContainer.appendChild(checkOnlyRendered);
		const onlyRenderedLabel = document.createElement('label');
		onlyRenderedLabel.classList.add('maplibregl-legend-onlyRendered-label');
		onlyRenderedLabel.textContent = this.options.onlyRenderedLabel || 'Only rendered';
		onlyRenderedLabel.htmlFor = checkboxOnlyRenderedId;
		onlyRenderedContainer.appendChild(onlyRenderedLabel);
		this.legendContainer.appendChild(onlyRenderedContainer);

		this.map.on('moveend', () => {
			this.updateLegendControl();
		});
		this.map.on('styledata', () => {
			this.updateLegendControl();
		});
		const afterLoadListener = () => {
			if (map.loaded()) {
				this.updateLegendControl();
				map.off('idle', afterLoadListener);
			}
		};
		if (map.loaded()) {
			// the control is added after the map is loaded: 'idle' might not be fired until the map is changed
			this.updateLegendControl();
		} else {
			this.map.on('idle', afterLoadListener);
		}

		if (this.options && this.options.showDefault == true) {
			this.legendContainer.style.display = 'block';
			this.legendButton.style.display = 'none';
		}

		return this.controlContainer;
	}

	public onRemove(): void {
		if (
			!this.controlContainer ||
			!this.controlContainer.parentNode ||
			!this.map ||
			!this.legendButton
		) {
			return;
		}
		this.legendButton.removeEventListener('click', this.onDocumentClick);
		this.controlContainer.parentNode.removeChild(this.controlContainer);
		document.removeEventListener('click', this.onDocumentClick);
		this.map = undefined;
	}

	public redraw(): void {
		this.updateLegendControl();
	}

	private onDocumentClick(event: MouseEvent): void {
		if (
			this.controlContainer &&
			!this.controlContainer.contains(event.target as Element) &&
			this.legendContainer &&
			this.legendButton
		) {
			if (this.options && this.options.showDefault !== true) {
				this.legendContainer.style.display = 'none';
				this.legendButton.style.display = 'block';
			}
		}
	}

	private handleClickOnlyRendered(e) {
		const _checked = e.target?.checked;
		this.onlyRendered = _checked ? true : false;
		this.updateLegendControl();
	}
}
