export type MapLibrary = 'maplibre' | 'mapbox';

export const STYLE_URL = 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json';
export const CENTER: [number, number] = [35.87063, -1.08551];
export const ZOOM = 12;

/** layer id and the title shown in the legend */
export const TARGETS: { [key: string]: string } = {
	pipeline: 'Pipeline',
	pipeline_annotation: 'Pipeline Label',
	meter: 'Water Meter',
	'flow meter': 'Flow Meter',
	valve: 'Valve',
	firehydrant: 'Fire Hydrant',
	washout: 'Washout',
	tank: 'Tank',
	tank_annotation: 'Tank Label',
	wtp: 'WTP',
	wtp_annotation: 'WTP Label',
	intake: 'Intake',
	intake_annotation: 'Intake Label',
	parcels: 'Parcels',
	parcels_annotation: 'Parcels Label',
	village: 'Village',
	village_annotation: 'Village Label',
	dma: 'DMA',
	'dma-annotation': 'DMA Label',
	'contour-line': 'Countour',
	'contour-label': 'Contour Label',
	hillshade: 'Hillshade'
};

export interface DemoOptions {
	showDefault: boolean;
	showCheckbox: boolean;
	onlyRendered: boolean;
	reverseOrder: boolean;
	title: string;
	onlyRenderedLabel: string;
	/** true: only layers in TARGETS are shown. false: all layers are shown */
	useTargets: boolean;
}

export const DEFAULT_OPTIONS: DemoOptions = {
	showDefault: true,
	showCheckbox: true,
	onlyRendered: true,
	reverseOrder: true,
	title: 'Legend',
	onlyRenderedLabel: 'Only rendered',
	useTargets: true
};

const BOOLEAN_KEYS = [
	'showDefault',
	'showCheckbox',
	'onlyRendered',
	'reverseOrder',
	'useTargets'
] as const;
const STRING_KEYS = ['title', 'onlyRenderedLabel'] as const;

/** convert options to URL search params. Only values different from the defaults are written */
export const optionsToSearchParams = (options: DemoOptions): URLSearchParams => {
	const params = new URLSearchParams();
	for (const key of BOOLEAN_KEYS) {
		if (options[key] !== DEFAULT_OPTIONS[key]) params.set(key, String(options[key]));
	}
	for (const key of STRING_KEYS) {
		if (options[key] && options[key] !== DEFAULT_OPTIONS[key]) params.set(key, options[key]);
	}
	return params;
};

/** read options from URL search params */
export const searchParamsToOptions = (params: Pick<URLSearchParams, 'get'>): DemoOptions => {
	const options = { ...DEFAULT_OPTIONS };
	for (const key of BOOLEAN_KEYS) {
		const value = params.get(key);
		if (value === 'true' || value === 'false') options[key] = value === 'true';
	}
	for (const key of STRING_KEYS) {
		const value = params.get(key);
		if (value) options[key] = value;
	}
	return options;
};

/** options passed to the legend control constructor */
export const toLegendOptions = (options: DemoOptions) => {
	return {
		showDefault: options.showDefault,
		showCheckbox: options.showCheckbox,
		onlyRendered: options.onlyRendered,
		reverseOrder: options.reverseOrder,
		title: options.title,
		onlyRenderedLabel: options.onlyRenderedLabel
	};
};
