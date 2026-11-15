import { LegendCache } from './cache';
import { defaultFetchGlyphs, type GlyphFetcher } from '../assets/glyphs';
import { defaultEncoder } from '../assets/images/encoder';
import { outputPixelRatio } from '../assets/sdf';
import { defaultImageLoader } from '../assets/raster';
import { canvasMeasurer, safeMeasurer, type TextMeasurer } from '../util/text-measure';
import type { ImageEncoder, LegendOptions, SwatchOptions } from './types';

export const DEFAULT_SWATCH: SwatchOptions = { width: 30, height: 20, maxSize: 40, frame: true };
export const DEFAULT_LABEL = 'Other';

type Optional =
	| 'center'
	| 'getImage'
	| 'listImages'
	| 'sources'
	| 'sampleText'
	| 'resolveRasterUrl'
	| 'loadImage'
	| 'adapters';

/** Legend options with the defaults filled in */
export type ResolvedOptions = Omit<Required<LegendOptions>, Optional> &
	Pick<LegendOptions, Optional> & {
		swatch: SwatchOptions;
		cache: LegendCache;
		imageEncoder: ImageEncoder;
		fetchGlyphs: GlyphFetcher;
		measureText: TextMeasurer;
	};

export function resolveOptions(options: LegendOptions = {}): ResolvedOptions {
	const doc = options.document ?? globalThis.document;
	if (!doc) throw new Error('maplibre2svg: no document to create the SVG with');
	return {
		...options,
		zoom: options.zoom ?? 0,
		defaultLabel: options.defaultLabel ?? DEFAULT_LABEL,
		swatch: { ...DEFAULT_SWATCH, ...options.swatch },
		glyphs: options.glyphs ?? true,
		// a cache of this call only, when the caller keeps none
		cache: options.cache ? LegendCache.from(options.cache) : new LegendCache(),
		imageEncoder: options.imageEncoder ?? defaultEncoder(doc),
		fetchGlyphs: options.fetchGlyphs ?? defaultFetchGlyphs,
		measureText: safeMeasurer(options.measureText ?? canvasMeasurer(doc)),
		loadImage: options.loadImage ?? defaultImageLoader(doc),
		pixelRatio: outputPixelRatio(options.pixelRatio),
		document: doc
	};
}
