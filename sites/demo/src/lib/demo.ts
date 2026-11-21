import type { LegendGroups } from '@watergis/maplibre-gl-legend';

export type MapLibrary = 'maplibre' | 'mapbox';

export const STYLE_URL = 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json';
export const CENTER: [number, number] = [35.87063, -1.08551];
export const ZOOM = 12;

/** layer id and the title shown in the legend */
export const TARGETS: { [key: string]: string } = {
	pipeline: 'Pipeline',
	// pipeline_annotation: 'Pipeline Label',
	meter: 'Water Meter',
	'flow meter': 'Flow Meter',
	valve: 'Valve',
	firehydrant: 'Fire Hydrant',
	washout: 'Washout',
	//tank: 'Tank',
	tank_annotation: 'Tank',
	//wtp: 'WTP',
	wtp_annotation: 'WTP',
	//intake: 'Intake',
	intake_annotation: 'Intake',
	parcels: 'Parcels',
	//parcels_annotation: 'Parcels Label',
	village: 'Village',
	//village_annotation: 'Village Label',
	dma: 'DMA',
	//'dma-annotation': 'DMA Label',
	'contour-line': 'Countour',
	//'contour-label': 'Contour Label',
	hillshade: 'Hillshade'
};

/** groups of layers used by the maplibre-gl-legend demo: group title and its layer ids, or its nested groups */
export const DEMO_GROUPS: LegendGroups = {
	// groups can be nested to any depth: an object of groups, or groups next to layer IDs in an array
	'Water Supply': {
		'Water Facilities': {
			WTP: ['wtp', 'wtp_annotation'],
			Intake: ['intake', 'intake_annotation'],
			Tank: ['tank', 'tank_annotation']
		},
		'Water Pipes': ['pipeline', 'pipeline_annotation'],
		'Meters': ['meter', 'flow meter'],
		'Valves': ['valve'],
		'Washout': ['washout'],
		'Fire Hydrants': ['firehydrant']
	},
	'Zones': {
		Village: ['village', 'village_annotation'],
		DMA: ['dma', 'dma-annotation']
	},
	'Parcels': ['parcels', 'parcels-outline', 'parcels_annotation'],
	'Contours': ['contour-line', 'contour-label'],
};

type OptionValues = Record<string, boolean | string>;

/** options of mapbox-gl-legend demo */
export interface MapboxDemoOptions extends OptionValues {
	showDefault: boolean;
	showCheckbox: boolean;
	onlyRendered: boolean;
	reverseOrder: boolean;
	title: string;
	onlyRenderedLabel: string;
	/** true: only layers in TARGETS are shown. false: all layers are shown */
	useTargets: boolean;
}

/** options of maplibre-gl-legend demo */
export interface MaplibreDemoOptions extends MapboxDemoOptions {
	/** true: DEMO_GROUPS is passed as `groups` option */
	useGroups: boolean;
	groupBySourceLayer: boolean;
	collapseGroups: boolean;
	showStyleEditor: boolean;
}

export const MAPBOX_DEFAULTS: MapboxDemoOptions = {
	showDefault: true,
	showCheckbox: true,
	onlyRendered: true,
	reverseOrder: true,
	title: 'Legend',
	onlyRenderedLabel: 'Only rendered',
	useTargets: true
};

export const MAPLIBRE_DEFAULTS: MaplibreDemoOptions = {
	...MAPBOX_DEFAULTS,
	useGroups: true,
	groupBySourceLayer: false,
	collapseGroups: false,
	showStyleEditor: true
};

/** a field of the options panel */
export interface OptionField {
	key: string;
	label: string;
}

export const MAPBOX_FIELDS: OptionField[] = [
	{ key: 'showDefault', label: 'showDefault' },
	{ key: 'showCheckbox', label: 'showCheckbox' },
	{ key: 'onlyRendered', label: 'onlyRendered' },
	{ key: 'reverseOrder', label: 'reverseOrder' },
	{ key: 'useTargets', label: 'Show only target layers' },
	{ key: 'title', label: 'title' },
	{ key: 'onlyRenderedLabel', label: 'onlyRenderedLabel' }
];

export const MAPLIBRE_FIELDS: OptionField[] = [
	...MAPBOX_FIELDS,
	{ key: 'useGroups', label: 'groups (example groups)' },
	{ key: 'groupBySourceLayer', label: 'groupBySourceLayer' },
	{ key: 'collapseGroups', label: 'collapseGroups' },
	{ key: 'showStyleEditor', label: 'showStyleEditor' }
];

/** convert options to URL search params. Only values different from the defaults are written */
export const optionsToSearchParams = <T extends OptionValues>(
	options: T,
	defaults: T
): URLSearchParams => {
	const params = new URLSearchParams();
	for (const key of Object.keys(defaults)) {
		const value = options[key];
		if (value === defaults[key]) continue;
		if (typeof value === 'boolean') params.set(key, String(value));
		else if (value) params.set(key, value);
	}
	return params;
};

/** read options from URL search params. The type of each value is taken from the defaults */
export const searchParamsToOptions = <T extends OptionValues>(
	params: Pick<URLSearchParams, 'get'>,
	defaults: T
): T => {
	const options: OptionValues = { ...defaults };
	for (const key of Object.keys(defaults)) {
		const value = params.get(key);
		if (!value) continue;
		if (typeof defaults[key] === 'boolean') {
			if (value === 'true' || value === 'false') options[key] = value === 'true';
		} else {
			options[key] = value;
		}
	}
	return options as T;
};

/** options passed to the mapbox-gl-legend control constructor */
export const toLegendOptions = (options: MapboxDemoOptions) => {
	return {
		showDefault: options.showDefault,
		showCheckbox: options.showCheckbox,
		onlyRendered: options.onlyRendered,
		reverseOrder: options.reverseOrder,
		title: options.title,
		onlyRenderedLabel: options.onlyRenderedLabel
	};
};

/** options passed to the maplibre-gl-legend control constructor */
export const toMaplibreLegendOptions = (options: MaplibreDemoOptions) => {
	return {
		...toLegendOptions(options),
		...(options.useGroups ? { groups: DEMO_GROUPS } : {}),
		groupBySourceLayer: options.groupBySourceLayer,
		collapseGroups: options.collapseGroups,
		showStyleEditor: options.showStyleEditor
	};
};
