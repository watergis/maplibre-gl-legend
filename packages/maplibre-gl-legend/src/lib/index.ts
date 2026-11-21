import { ControlPosition, IControl, LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';
import { createLayerLegend, createLegendCache, legendToSvg } from '@watergis/maplibre2svg';
import { StyleEditorDialog, type StyleEditorPosition } from '@watergis/style-editor-ui';
// the styles of the plugin; Vite bundles them with the styles of the style editor (Svelte components)
import '../scss/maplibre-gl-legend.scss';

/**
 * Options of {@link MaplibreLegendControl}.
 *
 * Every option can be omitted when it is passed to the constructor: the default value is used
 * instead.
 */
export interface LegendOptions {
	/**
	 * Whether the legend panel is open when the control is added.
	 *
	 * - `true`: the panel is open. It stays open until the user closes it with its close button.
	 * - `false`: only the legend button is shown, and the user opens the panel with it. The panel
	 *   is closed again when the user clicks outside the control.
	 *
	 * @defaultValue `true`
	 */
	showDefault: boolean;
	/**
	 * Whether each layer (and each group) has a toggle to show / hide it on the map.
	 *
	 * The toggle sets the `visibility` layout property of the layer. Toggles of the same layer in
	 * other legend controls are kept in sync.
	 *
	 * @defaultValue `true`
	 */
	showCheckbox: boolean;
	/**
	 * The order of the layers in the legend.
	 *
	 * - `true`: the top-most layer of the style (the last one in `style.layers`) comes first, as
	 *   they are stacked on the map.
	 * - `false`: the layers are listed in the order of `style.layers`.
	 *
	 * @defaultValue `true`
	 */
	reverseOrder: boolean;
	/**
	 * The initial state of the "Only rendered" switch in the panel.
	 *
	 * - `true`: only the layers which have features rendered in the current view are listed. The
	 *   list is updated when the map is moved. Layers hidden with the toggle stay listed, so that
	 *   they can be shown again.
	 * - `false`: all layers in `targets` are listed.
	 *
	 * The user can change it with the switch.
	 *
	 * @defaultValue `true`
	 */
	onlyRendered: boolean;
	/**
	 * The title shown at the top of the panel.
	 *
	 * @defaultValue `'Legend'`
	 */
	title?: string;
	/**
	 * The label of the "Only rendered" switch, e.g. to translate it.
	 *
	 * @defaultValue `'Only rendered'`
	 */
	onlyRenderedLabel?: string;
	/**
	 * Groups of layers listed (and shown / hidden) together: the title of each group and the IDs of
	 * its layers.
	 *
	 * - The layers of a group are listed under the group title, at the position of the first of
	 *   them. Clicking the group row collapses / expands the group.
	 * - The toggle of a group shows / hides all of its layers, including the layers not rendered in
	 *   the current view. It is shown as partially checked when only some of them are visible. Each
	 *   layer keeps its own toggle.
	 * - A layer in a group but not in `targets` is not listed, but the toggle of the group still
	 *   shows / hides it (e.g. a label layer switched with its features). With an empty `targets`
	 *   (`{}`), all layers are listed, titled by their IDs.
	 * - A group with only one layer in `targets` (its other layers are not in `targets`) is shown as
	 *   a single layer row, without the group title. The toggle of the row still shows / hides all
	 *   layers of the group. A group with 2+ layers in `targets` stays a group even if only one of
	 *   them is rendered with {@link onlyRendered}.
	 * - A layer belongs to the first group listing it.
	 * - A group without any layer listed is not shown.
	 *
	 * @example
	 * ```ts
	 * {
	 * 	groups: {
	 * 		Pipeline: ['pipeline', 'pipeline_annotation'],
	 * 		'Water Facilities': ['wtp', 'wtp_annotation', 'tank', 'tank_annotation']
	 * 	}
	 * }
	 * ```
	 *
	 * @defaultValue `undefined` (no group)
	 */
	groups?: { [title: string]: string[] };
	/**
	 * Whether the layers not in {@link groups} which share the same `source` and `source-layer`
	 * are grouped automatically, titled by the source-layer name.
	 *
	 * Such a group is made only while two or more of its layers are listed: with
	 * {@link onlyRendered}, a single layer rendered at the current zoom is listed as a layer.
	 *
	 * @defaultValue `false`
	 */
	groupBySourceLayer?: boolean;
	/**
	 * Whether the groups are collapsed when they are shown first. The state the user sets is kept
	 * while the legend is updated.
	 *
	 * @defaultValue `false`
	 */
	collapseGroups?: boolean;
	/**
	 * Whether each layer has a button opening the style editor, a dialog to change the style of
	 * the layer on the map: its color, opacity, width, size, ... depending on the layer type, or
	 * its `paint` and `layout` properties as YAML / JSON in the manual editor.
	 *
	 * The dialog is not modal: the map can be moved while it is open, and the legend shows the
	 * changes at once. It is placed on the side of the map opposite to the control, and can be moved
	 * inside the map by dragging its header. It is not higher than the map: its contents scroll.
	 *
	 * Its look is changed with the `--gl-style-editor-*` custom properties: see the
	 * `maplibre-gl-legend.css` file.
	 *
	 * @defaultValue `false`
	 */
	showStyleEditor?: boolean;
}

/** a row of the legend: a single layer, or a group of layers */
type LegendItem =
	| { type: 'layer'; layer: LayerSpecification }
	| {
			type: 'group';
			key: string;
			title: string;
			/** the layers listed in the group */
			layers: LayerSpecification[];
			/** the IDs of the layers switched by the group toggle, including the layers in the group not listed */
			toggleLayerIds: string[];
			/** true: grouped automatically by source-layer */
			auto: boolean;
	  };

/**
 * A MapLibre GL JS control which shows a legend panel of the map's layers.
 *
 * The panel has:
 *
 * - a title ({@link LegendOptions.title}) and a close button. When the panel is closed, a legend
 *   button opens it again.
 * - the "Only rendered" switch ({@link LegendOptions.onlyRendered}), to list only the layers
 *   rendered in the current view.
 * - a row per layer: a toggle to show / hide the layer ({@link LegendOptions.showCheckbox}), its
 *   symbol and its title. A layer styled by data (e.g. `match` or `step` expressions) has a row for
 *   each of its classes under the layer row. A layer which has nothing to draw is not listed.
 * - optionally, groups of layers ({@link LegendOptions.groups},
 *   {@link LegendOptions.groupBySourceLayer}).
 *
 * The legend is updated when the map is moved and when the style changes.
 *
 * @example
 * ```ts
 * map.on('load', () => {
 * 	const targets = {
 * 		pipeline: 'Pipeline',
 * 		pipeline_annotation: 'Pipeline Label',
 * 		valve: 'Valve'
 * 	};
 *
 * 	// closed at first, without the toggles, listing all layers in targets
 * 	map.addControl(
 * 		new MaplibreLegendControl(targets, {
 * 			showDefault: false,
 * 			showCheckbox: false,
 * 			onlyRendered: false
 * 		}),
 * 		'top-right'
 * 	);
 *
 * 	// all layers of the style, in the order of style.layers
 * 	map.addControl(new MaplibreLegendControl({}, { reverseOrder: false }), 'bottom-left');
 *
 * 	// pipeline layers are listed and switched together
 * 	map.addControl(
 * 		new MaplibreLegendControl(targets, {
 * 			groups: { Pipeline: ['pipeline', 'pipeline_annotation'] }
 * 		}),
 * 		'top-left'
 * 	);
 * });
 * ```
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
		groupBySourceLayer: false,
		collapseGroups: false,
		showStyleEditor: false
	};
	// keeps the glyphs and tiles loaded for the legend between redraws
	private legendCache = createLegendCache();
	// collapsed state of each group (by group key), kept between redraws
	private collapsedGroups: Map<string, boolean> = new Map();
	// layer IDs of each group (by group key) in the current legend
	private groupLayers: Map<string, string[]> = new Map();
	private redrawScheduled = false;
	// the style editor dialog, created when it is opened first with `showStyleEditor`
	private styleEditor?: StyleEditorDialog;

	/**
	 * Create a legend control. Add it to the map with `map.addControl()`, after the style is loaded
	 * (e.g. in the `load` event).
	 *
	 * @param targets The layers listed in the legend: the layer ID and the title shown for it, e.g.
	 *   `{ pipeline: 'Pipeline' }`. The layers are listed in the order of the style, not of this
	 *   object. With an empty object (`{}`), all layers of the style are listed, titled by their
	 *   IDs.
	 * @param options The options of the legend. Omitted options use their default values: see
	 *   {@link LegendOptions}.
	 */
	constructor(targets: { [key: string]: string }, options?: Partial<LegendOptions>) {
		this.targets = targets;
		if (options) {
			this.options = Object.assign(this.options, options);
		}
		this.onlyRendered = this.options.onlyRendered;
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	/**
	 * The position of the control when `map.addControl()` is called without a position.
	 *
	 * @returns `'top-right'`
	 */
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
	 * @param layer the layer
	 * @param groupToggle the group shown as this single layer: the checkbox switches all layers of the group
	 * @returns the TD Element holding the checkbox, or undefined without `showCheckbox`
	 */
	private createLayerCheckbox(
		layer: LayerSpecification,
		groupToggle?: { key: string; layerIds: string[] }
	): HTMLElement | undefined {
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

		if (groupToggle) {
			// its state (checked / partially visible) is set from all layers of the group by updateGroupStates
			checklayer.classList.add('maplibregl-legend-group-toggle');
			checklayer.dataset.group = groupToggle.key;
		}

		checklayer.addEventListener('click', () => {
			for (const layerId of groupToggle?.layerIds ?? [layer.id]) {
				this.setLayerVisibility(layerId, checklayer.checked);
			}
			this.updateGroupStates();
			this.redrawWhenIdle();
		});
		td.appendChild(checklayer);

		return td;
	}

	/**
	 * create the button opening the style editor of a layer
	 * @param layer the layer
	 * @returns the TD Element holding the button, or undefined without `showStyleEditor`
	 */
	private createStyleButton(layer: LayerSpecification): HTMLElement | undefined {
		if (!this.options.showStyleEditor) return;

		const td = document.createElement('TD');
		td.className = 'legend-table-td maplibregl-legend-style-td';
		// the icon is drawn by CSS (.maplibregl-legend-style-button::before)
		const button = document.createElement('button');
		button.type = 'button';
		button.classList.add('maplibregl-legend-style-button');
		const layerTitle = this.targets?.[layer.id] ?? layer.id;
		button.setAttribute('aria-label', `Edit style of ${layerTitle}`);
		button.title = 'Edit style';
		button.addEventListener('click', () => {
			this.openStyleEditor(layer.id, layerTitle);
		});
		td.appendChild(button);
		return td;
	}

	/**
	 * Create and return a layer's legend rows
	 * @param layer the layer
	 * @param groupKey the key of the group the layer belongs to
	 * @param groupToggle the group shown as this single layer: its checkbox switches all layers of the group
	 * @returns the TBODY Element holding the layer's rows, and a promise resolved with false when the layer has no legend (the TBODY is removed)
	 */
	private getLayerLegend(
		layer: LayerSpecification,
		groupKey?: string,
		groupToggle?: { key: string; layerIds: string[] }
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

		const td0 = this.createLayerCheckbox(layer, groupToggle);
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

		const td3 = this.createStyleButton(layer);

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
		if (td3) tr.appendChild(td3);
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
			checkbox.dataset.group = item.key;
			checkbox.setAttribute('aria-label', `Toggle visibility of ${item.title}`);
			checkbox.title = 'Toggle visibility';
			checkbox.addEventListener('click', () => {
				// a partially visible group becomes visible
				const visible = checkbox.checked;
				for (const layerId of item.toggleLayerIds) {
					this.setLayerVisibility(layerId, visible);
				}
				this.updateGroupStates();
				this.redrawWhenIdle();
			});
			td0.appendChild(checkbox);
			tr.appendChild(td0);
		}

		// the title spans the symbol, label (and style button) columns, with the collapse button at its right end
		const td1 = document.createElement('TD');
		td1.className = 'legend-table-td';
		td1.setAttribute('colspan', this.options.showStyleEditor ? '3' : '2');
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

	/** update the group checkboxes (of group headers, and of groups shown as a single layer) from the visibility of their layers: checked, unchecked, or indeterminate (partially visible) */
	private updateGroupStates() {
		if (!this.legendTable) return;
		for (const checkbox of Array.from(
			this.legendTable.querySelectorAll('input.maplibregl-legend-group-toggle')
		)) {
			if (!(checkbox instanceof HTMLInputElement)) continue;
			const layerIds = this.groupLayers.get(checkbox.dataset.group ?? '') ?? [];
			const visibleCount = layerIds.filter((id) => this.isLayerVisible(id)).length;
			checkbox.checked = visibleCount > 0 && visibleCount === layerIds.length;
			checkbox.indeterminate = visibleCount > 0 && visibleCount < layerIds.length;
		}
	}

	/**
	 * whether a layer is listed in the legend (regardless of whether it is rendered).
	 * A layer in a group but not in the targets is not listed, but the group toggle still switches it
	 */
	private isTarget(layerId: string): boolean {
		if (this.targets === undefined || Object.keys(this.targets).length === 0) return true;
		return layerId in this.targets;
	}

	/**
	 * put layers into groups: the groups in the options first, then layers sharing source and source-layer
	 * @param layers layers in the order shown in the legend
	 * @param allLayers all layers of the style in the same order, including the layers not listed
	 * @returns the rows of the legend. A group is placed at the position of its first listed layer
	 */
	private createLegendItems(
		layers: LayerSpecification[],
		allLayers: LayerSpecification[]
	): LegendItem[] {
		const groupKeys: Map<string, string> = new Map();
		const titles: Map<string, string> = new Map();
		const styleLayerIds = new Set(allLayers.map((l) => l.id));

		// membership is decided over all layers of the style, so a layer not listed still belongs to the first group listing it
		for (const [title, ids] of Object.entries(this.options.groups ?? {})) {
			const key = `group:${title}`;
			for (const id of ids) {
				if (!styleLayerIds.has(id) || groupKeys.has(id)) continue;
				groupKeys.set(id, key);
				titles.set(key, title);
			}
		}

		if (this.options.groupBySourceLayer) {
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
				const auto = key.startsWith('source-layer:');
				group = {
					type: 'group',
					key,
					title: titles.get(key) ?? key,
					layers: [],
					// an auto group has only listed layers; a group in the options switches its layers not listed too
					toggleLayerIds: auto
						? []
						: allLayers.filter((l) => groupKeys.get(l.id) === key).map((l) => l.id),
					auto
				};
				groups.set(key, group);
				items.push(group);
			}
			group.layers.push(layer);
			if (group.auto) group.toggleLayerIds.push(layer.id);
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
		for (const item of this.createLegendItems(targetLayers, layers)) {
			if (item.type === 'layer') {
				if (!isShown(item.layer)) continue;
				const legend = this.getLayerLegend(item.layer);
				if (legend) this.legendTable.appendChild(legend.tbody);
				continue;
			}

			const shownLayers = item.layers.filter(isShown);
			if (shownLayers.length === 0) continue;
			// a group in the options with only one layer in the targets is shown as a single layer, and keeps switching all of its layers with the toggle of the layer.
			// it stays a group when 2+ of its layers are in the targets, even if only one is rendered now, so that the toggle of a layer does not switch the others.
			// a source-layer group with only one layer listed now (e.g. its other layers are not rendered at this zoom) is shown as a single layer switching the layer alone
			const single = item.auto ? shownLayers.length === 1 : item.layers.length === 1;
			if (single) {
				let groupToggle: { key: string; layerIds: string[] } | undefined;
				if (!item.auto) {
					this.groupLayers.set(item.key, item.toggleLayerIds);
					groupToggle = { key: item.key, layerIds: item.toggleLayerIds };
				}
				const legend = this.getLayerLegend(shownLayers[0], undefined, groupToggle);
				if (legend) this.legendTable.appendChild(legend.tbody);
				continue;
			}
			// the group checkbox switches all layers of the group, including layers not rendered now and layers not listed
			this.groupLayers.set(item.key, item.toggleLayerIds);
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

	/**
	 * Create the panel and start updating it with the map. Called by `map.addControl()`: you do not
	 * need to call it yourself.
	 *
	 * @param map The map the control is added to.
	 * @returns The element of the control, placed on the map by MapLibre.
	 */
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

	/**
	 * Remove the panel from the map. Called by `map.removeControl()`: you do not need to call it
	 * yourself.
	 */
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
		this.styleEditor?.close();
		this.styleEditor = undefined;
		this.map = undefined;
	}

	/**
	 * Update the legend now.
	 *
	 * The legend is updated by itself when the map is moved and when the style changes. Call this
	 * when something else changed what it shows, e.g. layer visibility set by your code.
	 */
	public redraw(): void {
		this.updateLegendControl();
	}

	/**
	 * open the style editor for a layer. The dialog is placed in the top corner of the map opposite to the control
	 * @param layerId the layer ID
	 * @param title the title of the layer
	 */
	private openStyleEditor(layerId: string, title: string) {
		const map = this.map;
		if (!map) return;
		if (!this.styleEditor) {
			const mapRect = map.getContainer().getBoundingClientRect();
			const controlRect = this.controlContainer.getBoundingClientRect();
			const controlOnRight =
				controlRect.left + controlRect.width / 2 > mapRect.left + mapRect.width / 2;
			const position: StyleEditorPosition = controlOnRight ? 'top-left' : 'top-right';
			this.styleEditor = new StyleEditorDialog({
				map,
				position,
				container: map.getContainer()
			});
		}
		this.styleEditor.open({ layerId, title });
	}

	private onDocumentClick(event: MouseEvent): void {
		if (
			this.controlContainer &&
			!this.controlContainer.contains(event.target as Element) &&
			// clicks in the style editor do not close the legend
			!this.styleEditor?.contains(event.target as Node) &&
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
