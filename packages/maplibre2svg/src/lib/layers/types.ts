import type { EvaluatedLayer } from '../expression';
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
