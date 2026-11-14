import type { EvaluatedLayer } from '../expression';
import type { GlyphFetcher } from '../glyphs';
import type { ImageContext } from '../images';
import type { SwatchOptions } from '../types';

/** What a renderer is given besides the evaluated layer */
export interface RenderContext {
	document: Document;
	swatch: SwatchOptions;
	/**
	 * The layer evaluated for every class of the legend, this one included, for what is
	 * relative between the classes, such as the height of an extrusion
	 */
	siblings: EvaluatedLayer[];
	/** the images of the style, for icons and patterns */
	images: ImageContext;
	/** device pixels per CSS pixel which raster parts (tinted icons, text) are drawn at */
	pixelRatio: number;
	/** how labels are drawn */
	text: TextContext;
}

/** Where the glyphs of labels come from */
export interface TextContext {
	/** `style.glyphs`; undefined to draw labels with CSS fonts */
	glyphs?: string;
	fetchGlyphs: GlyphFetcher;
	/** the sample of a label which gives no text */
	sampleText: string;
}

/** A symbol of the legend: an `<svg>` with `width`, `height` and `viewBox` */
export interface RenderedSymbol {
	svg: SVGSVGElement;
	width: number;
	height: number;
}

/** Draws the symbol of one class of a layer type */
export type Renderer = (
	layer: EvaluatedLayer,
	ctx: RenderContext
) => RenderedSymbol | Promise<RenderedSymbol>;
