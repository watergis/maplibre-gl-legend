import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

export type { LayerSpecification, StyleSpecification };

/**
 * What a legend entry stands for:
 * - `single`: the whole layer, which has no feature-dependent classification
 * - `category`: a branch of a `match` or a condition of a `case`
 * - `range`: an interval of a `step`
 * - `stop`: a stop of an `interpolate`
 * - `default`: the fallback of a `match` or a `case`
 * - `ramp`: a continuous color ramp, such as of a heatmap
 */
export type LegendEntryKind = 'single' | 'category' | 'range' | 'stop' | 'default' | 'ramp';

/** One row of the legend of a layer: a symbol and its label */
export interface LegendEntry {
	/** label of the class, or the label of the layer when it is the only entry */
	label: string;
	kind: LegendEntryKind;
	/** the symbol, with `width` and `height` attributes */
	svg: SVGSVGElement;
	width: number;
	height: number;
}

/** The legend of one layer of a style */
export interface LayerLegend {
	layerId: string;
	type: string;
	/** label of the layer: `metadata.legend.label`, or the layer id */
	label: string;
	entries: LegendEntry[];
}

/** An image of the style, such as of the sprite, in RGBA */
export interface LegendImage {
	data: Uint8Array | Uint8ClampedArray;
	width: number;
	height: number;
	pixelRatio: number;
	sdf: boolean;
}

/** Size of a symbol in pixels */
export interface SwatchOptions {
	/** width of a symbol, 30 by default */
	width: number;
	/** height of a symbol, 20 by default */
	height: number;
	/** the largest width or height that a symbol can grow to, 40 by default */
	maxSize: number;
}

/** Keeps what the legends of a map are made from, such as glyphs and tiles, between calls */
export interface LegendCache {
	/** values keyed by where they were loaded from */
	readonly store: Map<string, Promise<unknown>>;
}

export interface LegendOptions {
	/** zoom level to evaluate the expressions at, 0 by default */
	zoom?: number;
	/** center of the map as `[lng, lat]`, for the thumbnails of raster layers */
	center?: [number, number];
	/** get an image of the style by its id, such as `(id) => map.getImage(id)` */
	getImage?: (id: string) => LegendImage | undefined;
	/** sources which override the ones of the style, e.g. with the `tiles` of TileJSON resolved */
	sources?: StyleSpecification['sources'];
	/** label of the fallback class of a `match` or a `case`, `Other` by default */
	defaultLabel?: string;
	/** size of a symbol */
	swatch?: Partial<SwatchOptions>;
	/** draw labels with the glyphs of the style, true by default. False uses CSS fonts only */
	glyphs?: boolean;
	cache?: LegendCache;
	/** document to create the SVG elements with, the global `document` by default */
	document?: Document;
}
