import type { ControlPosition, IControl, Map as MaplibreMap } from 'maplibre-gl';
import { LegendPanel, type LegendGroupMembers, type LegendGroups } from '@watergis/legend-ui';
import { StyleEditorDialog, type StyleEditorPosition } from '@watergis/style-editor-ui';
import { MaplibreLegendSource } from './maplibre-legend-source';
// the styles of the plugin; Vite bundles them with the styles of the legend panel and the style editor (Svelte components)
import '../scss/maplibre-gl-legend.scss';

export type { LegendGroupMembers, LegendGroups };

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
	 * Whether each layer (and each group) has a toggle to show / hide it on the map, at the right
	 * end of its row.
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
	 * - Groups can be nested to any depth (see {@link LegendGroups}): the members of a group are an
	 *   array of layer IDs, which can also have objects of nested groups, or an object of nested
	 *   groups. The legend is shown as a tree: a nested group is indented inside its parent, at the
	 *   position of its first layer. The toggle of a group shows / hides the layers of all its
	 *   nested groups too, and collapsing a group hides all of them. The rules above apply to nested
	 *   groups as well, counting the layers of their nested groups.
	 *
	 * @example
	 * ```ts
	 * {
	 * 	groups: {
	 * 		// a group of layers
	 * 		Pipeline: ['pipeline', 'pipeline_annotation'],
	 * 		// a group of groups
	 * 		'Water Facilities': {
	 * 			WTP: ['wtp', 'wtp_annotation'],
	 * 			Tank: ['tank', 'tank_annotation']
	 * 		},
	 * 		// a group of layers and groups
	 * 		'All Points': [{ 'Some Points': ['points-halo', 'points-circles'] }, 'points-symbols']
	 * 	}
	 * }
	 * ```
	 *
	 * @defaultValue `undefined` (no group)
	 */
	groups?: LegendGroups;
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
	 * Whether each layer has a button opening the style editor (at the left of its visibility
	 * toggle), a dialog to change the style of
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

/**
 * A MapLibre GL JS control which shows a legend panel of the map's layers.
 *
 * The panel has:
 *
 * - a title ({@link LegendOptions.title}) and a close button. When the panel is closed, a legend
 *   button opens it again.
 * - the "Only rendered" switch ({@link LegendOptions.onlyRendered}), to list only the layers
 *   rendered in the current view.
 * - a row per layer: its symbol, its title, and a toggle to show / hide the layer
 *   ({@link LegendOptions.showCheckbox}). A layer styled by data (e.g. `match` or `step` expressions) has a row for
 *   each of its classes under the layer row. A layer which has nothing to draw is not listed.
 * - optionally, groups of layers nested to any depth, shown as a tree ({@link LegendOptions.groups},
 *   {@link LegendOptions.groupBySourceLayer}).
 *
 * The panel is a Svelte component of the internal `@watergis/legend-ui` package.
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
	private legendButton: HTMLButtonElement;
	private panel?: LegendPanel;
	private targets: { [key: string]: string };
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
		this.onDocumentClick = this.onDocumentClick.bind(this);
		this.updateLegendControl = this.updateLegendControl.bind(this);
	}

	/**
	 * The position of the control when `map.addControl()` is called without a position.
	 *
	 * @returns `'top-right'`
	 */
	public getDefaultPosition(): ControlPosition {
		return 'top-right';
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

		this.legendButton = document.createElement('button');
		this.legendButton.type = 'button';
		this.legendButton.setAttribute('aria-label', 'Open legend');
		this.legendButton.title = 'Legend';
		this.legendButton.classList.add('maplibregl-ctrl-icon');
		this.legendButton.classList.add('maplibregl-legend-switcher');
		this.legendButton.addEventListener('click', () => this.setPanelOpen(true));
		this.controlContainer.appendChild(this.legendButton);
		document.addEventListener('click', this.onDocumentClick);

		const source = new MaplibreLegendSource(map, {
			// redraw after the map is rendered, so that layers just shown are listed as rendered layers
			onVisibilityChange: () => this.redrawWhenIdle(),
			openStyleEditor: (layerId, title) => this.openStyleEditor(layerId, title)
		});
		this.panel = new LegendPanel({
			target: this.controlContainer,
			source,
			targets: this.targets,
			options: this.options,
			open: false,
			onClose: () => this.setPanelOpen(false)
		});
		this.setPanelOpen(this.options.showDefault === true);

		map.on('moveend', this.updateLegendControl);
		// also when a layer is shown / hidden, so that the other legend controls follow
		map.on('styledata', this.updateLegendControl);
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
			map.on('idle', afterLoadListener);
		}

		return this.controlContainer;
	}

	/**
	 * Remove the panel from the map. Called by `map.removeControl()`: you do not need to call it
	 * yourself.
	 */
	public onRemove(): void {
		if (!this.controlContainer || !this.controlContainer.parentNode || !this.map) {
			return;
		}
		this.map.off('moveend', this.updateLegendControl);
		this.map.off('styledata', this.updateLegendControl);
		document.removeEventListener('click', this.onDocumentClick);
		this.panel?.destroy();
		this.panel = undefined;
		this.controlContainer.parentNode.removeChild(this.controlContainer);
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

	/** update the rows of the legend from the map */
	private updateLegendControl() {
		if (!this.map?.getStyle()) return;
		this.panel?.refresh();
	}

	/** show the panel (and hide the legend button), or the other way round */
	private setPanelOpen(open: boolean) {
		this.panel?.setOpen(open);
		this.legendButton.style.display = open ? 'none' : 'block';
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

	/** without `showDefault`, the panel is closed when the user clicks outside the control */
	private onDocumentClick(event: MouseEvent): void {
		if (this.options.showDefault === true || !this.controlContainer) return;
		const target = event.target as Node;
		if (
			this.controlContainer.contains(target) ||
			// clicks in the style editor do not close the legend
			this.styleEditor?.contains(target)
		) {
			return;
		}
		this.setPanelOpen(false);
	}
}
