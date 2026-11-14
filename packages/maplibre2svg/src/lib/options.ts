import type { LegendOptions, SwatchOptions } from './types';

export const DEFAULT_SWATCH: SwatchOptions = { width: 30, height: 20, maxSize: 40 };
export const DEFAULT_LABEL = 'Other';

/** Legend options with the defaults filled in */
export type ResolvedOptions = Omit<
	Required<LegendOptions>,
	'center' | 'getImage' | 'sources' | 'cache'
> &
	Pick<LegendOptions, 'center' | 'getImage' | 'sources' | 'cache'> & { swatch: SwatchOptions };

export function resolveOptions(options: LegendOptions = {}): ResolvedOptions {
	const doc = options.document ?? globalThis.document;
	if (!doc) throw new Error('maplibre2svg: no document to create the SVG with');
	return {
		...options,
		zoom: options.zoom ?? 0,
		defaultLabel: options.defaultLabel ?? DEFAULT_LABEL,
		swatch: { ...DEFAULT_SWATCH, ...options.swatch },
		glyphs: options.glyphs ?? true,
		document: doc
	};
}
