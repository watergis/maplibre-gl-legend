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

/**
 * A continuous color ramp: the domain and the colors along it, so that a host can draw ticks
 * or print the range
 */
export interface LegendRamp {
	min: number;
	max: number;
	/** sampled colors, CSS `rgba()`, by value from `min` to `max` */
	stops: { value: number; color: string }[];
	unit?: string;
}

/** One row of the legend of a layer: a symbol and its label */
export interface LegendEntry {
	/**
	 * Label of the class, or the label of the layer when it is the only entry. A `heatmap`
	 * has one `ramp` entry labelled with the layer: a host shows the layer's `label`, then the
	 * ramp with `ramp.min` / `ramp.max` (density 0 – 1) as ticks. `color-relief` has rows per
	 * elevation class like other classified layers.
	 */
	label: string;
	kind: LegendEntryKind;
	/** the symbol, with `width` and `height` attributes */
	svg: SVGSVGElement;
	width: number;
	height: number;
	/** the ramp of a `ramp` entry (heatmap) */
	ramp?: LegendRamp;
}

/** The legend of one layer of a style */
export interface LayerLegend {
	layerId: string;
	type: string;
	/** label of the layer: `metadata.legend.label`, or the layer id */
	label: string;
	entries: LegendEntry[];
}

/**
 * An image of the style, such as of the sprite: straight (not premultiplied) RGBA pixels,
 * `width × height × 4` bytes. From MapLibre's `map.getImage(id)`, which gives the pixels in
 * `image.data.data` and the size in `image.data.width` / `.height`:
 *
 * ```ts
 * getImage: (id) => {
 *   const image = map.getImage(id);
 *   const rgba = image?.data;
 *   if (!rgba || !('data' in rgba)) return undefined;
 *   return { data: rgba.data, width: rgba.width, height: rgba.height,
 *     pixelRatio: image.pixelRatio, sdf: image.sdf };
 * }
 * ```
 */
export interface LegendImage {
	data: Uint8Array | Uint8ClampedArray;
	width: number;
	height: number;
	/** physical pixels per CSS pixel of the image, e.g. 2 for `@2x` sprites */
	pixelRatio: number;
	/** whether the alpha channel holds a signed distance field to tint with `icon-color` */
	sdf: boolean;
}

/**
 * Encode RGBA pixels as an image URL, usually a PNG data URL. Undefined when it cannot,
 * such as without a canvas.
 */
export type ImageEncoder = (
	rgba: Uint8ClampedArray,
	width: number,
	height: number
) => Promise<string | undefined> | string | undefined;

/** Size of a symbol in pixels */
export interface SwatchOptions {
	/** width of a symbol, 30 by default */
	width: number;
	/** height of a symbol, 20 by default */
	height: number;
	/** the largest width or height that a symbol can grow to, 40 by default */
	maxSize: number;
	/**
	 * Draw a thin neutral frame around area symbols (fill, background) unless the layer has an
	 * outline of its own, so that very light or translucent areas still show. True by default.
	 */
	frame: boolean;
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
	/** get an image of the style by its id; see `LegendImage` for MapLibre's `map.getImage` */
	getImage?: (id: string) => LegendImage | undefined;
	/**
	 * The ids of the images there are, such as `() => map.listImages()`. Used to pick an image
	 * for an `icon-image` with `{tokens}` which the legend cannot fill
	 */
	listImages?: () => string[];
	/**
	 * Encode images, for the environments without a canvas or for tests. A DOM canvas, or an
	 * `OffscreenCanvas`, by default; without either, images are drawn as placeholders
	 */
	imageEncoder?: ImageEncoder;
	/**
	 * Sources which override the ones of the style, e.g. with the `tiles` of TileJSON resolved:
	 * a raster source with only a TileJSON `url` is shown as a placeholder
	 */
	sources?: StyleSpecification['sources'];
	/**
	 * Map the tile or image URL of a raster source to one the browser can load, such as a custom
	 * protocol or a signed URL. Undefined keeps the URL. Only `http(s):`, `data:image/`, `blob:` and
	 * relative URLs are shown; others give the placeholder
	 */
	/**
	 * Check that a raster tile loads before showing it; a tile which does not gives the
	 * placeholder. The `Image` of the document's window by default (none in Node)
	 */
	loadImage?: (url: string) => Promise<boolean>;
	resolveRasterUrl?: (
		url: string,
		source: unknown
	) => string | undefined | Promise<string | undefined>;
	/** label of the fallback class of a `match` or a `case`, `Other` by default */
	defaultLabel?: string;
	/** size of a symbol */
	swatch?: Partial<SwatchOptions>;
	/** draw labels with the glyphs of the style, true by default. False uses CSS fonts only */
	glyphs?: boolean;
	/**
	 * Get the bytes of a glyph PBF, so that the host can route the requests (MapLibre's
	 * `transformRequest`, custom protocols). `fetch` by default
	 */
	fetchGlyphs?: (url: string) => Promise<ArrayBuffer>;
	/**
	 * The text drawn as the sample of a label when the layer's own `text-field` gives no text
	 * for the legend (e.g. `{name}` without a feature). `Aa` by default
	 */
	sampleText?: string;
	/**
	 * Measure text in a CSS font shorthand, for labels drawn with CSS fonts and for
	 * `legendToSvg`. A canvas of the document by default; without one, widths are estimated
	 */
	measureText?: (text: string, font: string) => number | undefined;
	/**
	 * Device pixels per CSS pixel to draw tinted icons and label text at, from 1 to 3:
	 * `devicePixelRatio` by default
	 */
	pixelRatio?: number;
	cache?: LegendCache;
	/** document to create the SVG elements with, the global `document` by default */
	document?: Document;
}
