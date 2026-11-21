import type { LegendGroups } from './legend-groups';

/** Options of the legend panel. See `LegendOptions` of maplibre-gl-legend for the details. */
export interface LegendPanelOptions {
	/** The title shown at the top of the panel. Default `'Legend'` */
	title?: string;
	/** The label of the "Only rendered" switch. Default `'Only rendered'` */
	onlyRenderedLabel?: string;
	/** Whether each layer and group has a toggle to show / hide it. Default `true` */
	showCheckbox?: boolean;
	/** Whether each layer has a button opening the style editor. Default `false` */
	showStyleEditor?: boolean;
	/** true: the top-most layer comes first. Default `true` */
	reverseOrder?: boolean;
	/** The initial state of the "Only rendered" switch. Default `true` */
	onlyRendered?: boolean;
	/** Groups of layers, nested to any depth */
	groups?: LegendGroups;
	/** Whether the layers not in `groups` sharing source and source-layer are grouped automatically. Default `false` */
	groupBySourceLayer?: boolean;
	/** Whether the groups are collapsed at first. Default `false` */
	collapseGroups?: boolean;
}

/** The layers listed in the legend: the layer ID and its title. Empty: all layers, titled by their IDs */
export type LegendTargets = { [layerId: string]: string };
