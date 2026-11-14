import type { StyleSpecification } from 'maplibre-gl';
import { DEFAULT_SAMPLE } from './glyphs';
import type { RenderContext } from './layers';
import type { ResolvedOptions } from './options';

/** What the renderers of one layer are given, from the options and the style */
export function renderContextOf(
	resolved: ResolvedOptions,
	style: StyleSpecification
): Omit<RenderContext, 'siblings'> {
	return {
		document: resolved.document,
		swatch: resolved.swatch,
		images: {
			getImage: resolved.getImage,
			listImages: resolved.listImages,
			encode: resolved.imageEncoder,
			cache: resolved.cache
		},
		pixelRatio: resolved.pixelRatio,
		text: {
			glyphs: resolved.glyphs && typeof style.glyphs === 'string' ? style.glyphs : undefined,
			fetchGlyphs: resolved.fetchGlyphs,
			sampleText: resolved.sampleText ?? DEFAULT_SAMPLE,
			measure: resolved.measureText
		},
		raster: {
			sources: { ...style.sources, ...resolved.sources },
			center: resolved.center ?? [0, 0],
			zoom: resolved.zoom,
			pixelRatio: resolved.pixelRatio,
			resolveUrl: resolved.resolveRasterUrl,
			loadImage: resolved.loadImage,
			cache: resolved.cache
		}
	};
}
