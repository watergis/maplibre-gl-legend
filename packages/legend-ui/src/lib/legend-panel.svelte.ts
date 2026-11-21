import { mount, unmount } from 'svelte';
import LegendPanelComponent from './components/LegendPanel.svelte';
import { LegendModel } from './state/legend-model.svelte';
import type { LegendPanelOptions, LegendTargets } from './types/legend-panel-options';
import type { LegendSource } from './types/legend-source';

/** Options of {@link LegendPanel} */
export interface LegendPanelMountOptions {
	/** the element the panel is added to, e.g. the container of a MapLibre control */
	target: HTMLElement;
	/** what the panel needs from the map */
	source: LegendSource;
	/** the layers listed in the legend and their titles. Empty: all layers */
	targets: LegendTargets;
	options?: LegendPanelOptions;
	/** whether the panel is shown at first. Default `true` */
	open?: boolean;
	/** called when the close button is clicked (the panel is closed before) */
	onClose?: () => void;
}

/** Counter making the ids of the form elements unique when several panels are created */
let panelCount = 0;

/**
 * The legend panel, see `components/LegendPanel.svelte`: it mounts the Svelte component into the
 * target, and updates it from the legend source on {@link refresh}.
 *
 * @example
 * ```ts
 * const panel = new LegendPanel({ target: container, source, targets: {}, options: { groups } });
 * map.on('moveend', () => panel.refresh());
 * ```
 */
export class LegendPanel {
	/** the state of the panel */
	readonly model: LegendModel;
	private readonly props: {
		model: LegendModel;
		open: boolean;
		onclose: () => void;
		idPrefix: string;
	};
	private component: { contains: (node: Node | null) => boolean } | undefined;

	constructor(options: LegendPanelMountOptions) {
		this.model = new LegendModel(options.source, options.targets, options.options);
		this.props = $state({
			model: this.model,
			open: options.open ?? true,
			onclose: () => {
				this.setOpen(false);
				options.onClose?.();
			},
			idPrefix: `maplibregl-legend-${++panelCount}`
		});
		this.component = mount(LegendPanelComponent, { target: options.target, props: this.props });
	}

	/** Whether the panel is shown */
	get isOpen(): boolean {
		return this.props.open;
	}

	/** Show or hide the panel */
	setOpen(open: boolean): void {
		this.props.open = open;
	}

	/** Read the layers from the legend source, and update the rows of the panel */
	refresh(): void {
		this.model.refresh();
	}

	/**
	 * Whether a node is in the panel, e.g. to ignore the clicks in the panel.
	 *
	 * @param node the node
	 */
	contains(node: Node | null): boolean {
		return this.component?.contains(node) ?? false;
	}

	/** Remove the panel */
	destroy(): void {
		if (this.component) unmount(this.component);
		this.component = undefined;
	}
}
