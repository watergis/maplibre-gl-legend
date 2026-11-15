import type { LegendCache } from '../../core/cache';
import type { ImageEncoder } from '../../core/types';
import type { GlyphFetcher } from './load';
import { textImage, type TextImage, type TextImageRequest } from './text-image';

/** Where the glyphs come from and how the images are encoded */
export interface GlyphRendererInit {
	/** the `glyphs` URL template of the style, with `{fontstack}` and `{range}` */
	template: string;
	fetchGlyphs: GlyphFetcher;
	cache: LegendCache;
	encode: ImageEncoder;
	/** device pixels per CSS pixel to draw at */
	pixelRatio: number;
}

/** A label to draw: what `textImage` needs besides the setup of the renderer */
export type GlyphLabel = Omit<TextImageRequest, keyof GlyphRendererInit>;

/**
 * Draws labels with the SDF glyphs of a style, as MapLibre does, into images. Glyph ranges
 * and images are kept in the cache.
 */
export class GlyphRenderer {
	readonly #init: GlyphRendererInit;

	constructor(init: GlyphRendererInit) {
		this.#init = init;
	}

	/**
	 * The label as an image, or undefined when it cannot be drawn (a range does not load, a
	 * glyph is missing, no canvas): the caller then draws it with a CSS font
	 */
	render(label: GlyphLabel): Promise<TextImage | undefined> {
		return textImage({ ...label, ...this.#init });
	}
}
