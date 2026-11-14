import { createLegendCache } from './cache';
import { defaultEncoder } from './images/encoder';
import type { ImageEncoder, LegendCache, LegendOptions, SwatchOptions } from './types';

export const DEFAULT_SWATCH: SwatchOptions = { width: 30, height: 20, maxSize: 40, frame: true };
export const DEFAULT_LABEL = 'Other';

type Optional = 'center' | 'getImage' | 'listImages' | 'sources';

/** Legend options with the defaults filled in */
export type ResolvedOptions = Omit<Required<LegendOptions>, Optional> &
	Pick<LegendOptions, Optional> & {
		swatch: SwatchOptions;
		cache: LegendCache;
		imageEncoder: ImageEncoder;
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
		cache: options.cache ?? createLegendCache(),
		imageEncoder: options.imageEncoder ?? defaultEncoder(doc),
		document: doc
	};
}
