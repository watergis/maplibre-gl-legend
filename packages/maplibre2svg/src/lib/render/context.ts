import type { GlyphRenderer } from '../assets/glyphs';
import { displaySize, patternOf, type ImageStore } from '../assets/images';
import type { RasterSourceResolver } from '../assets/raster';
import type { SwatchOptions } from '../core/types';
import type { EvaluatedLayer } from '../style';
import type { TextMeasurer } from '../util/text-measure';
import { SvgDocument } from './svg';
import { Swatch } from './swatch';

/** How labels are drawn */
export interface TextContext {
	/** draws with the glyphs of the style; undefined to draw labels with CSS fonts */
	glyphs?: GlyphRenderer;
	/** the sample of a label which gives no text */
	sampleText: string;
	/** measures the CSS-font fallback; undefined to estimate */
	measure?: TextMeasurer;
}

/** Size of one tile of a pattern, in CSS pixels, and its offset */
export interface PatternTile {
	width: number;
	height: number;
	x?: number;
	y?: number;
}

/** A paint of a pattern: the `url(#id)` to fill with and the `<pattern>` to define */
export interface PatternPaint {
	paint: string;
	defs: Element;
}

/** What a `RenderContext` is made from */
export interface RenderContextInit {
	document: Document;
	swatch: SwatchOptions;
	/** the images of the style, for icons and patterns */
	images: ImageStore;
	/** device pixels per CSS pixel which raster parts (tinted icons, text) are drawn at */
	pixelRatio: number;
	text: TextContext;
	/** where raster thumbnails come from */
	raster: RasterSourceResolver;
	siblings?: EvaluatedLayer[];
}

/**
 * Everything a layer adapter draws with besides the evaluated layer: the document, the size of
 * a swatch, the images and glyphs of the style, the raster sources, and the other classes of
 * the layer
 */
export class RenderContext {
	readonly svg: SvgDocument;
	readonly swatch: SwatchOptions;
	readonly images: ImageStore;
	readonly pixelRatio: number;
	readonly text: TextContext;
	readonly raster: RasterSourceResolver;
	/**
	 * The layer evaluated for every class of the legend, this one included, for what is
	 * relative between the classes, such as the height of an extrusion
	 */
	readonly siblings: EvaluatedLayer[];

	constructor(init: RenderContextInit) {
		this.svg = new SvgDocument(init.document);
		this.swatch = init.swatch;
		this.images = init.images;
		this.pixelRatio = init.pixelRatio;
		this.text = init.text;
		this.raster = init.raster;
		this.siblings = init.siblings ?? [];
	}

	/** The document the elements are created in */
	get document(): Document {
		return this.svg.document;
	}

	/** The same context for the classes of a layer */
	withSiblings(siblings: EvaluatedLayer[]): RenderContext {
		return new RenderContext({ ...this, document: this.document, siblings });
	}

	/** A builder of a symbol of the size */
	createSwatch(width: number, height: number): Swatch {
		return new Swatch(this, width, height);
	}

	/**
	 * A paint of the image of `fill-pattern`, `line-pattern` and the like, tiled at its display
	 * size or at the size `tile` gives. Undefined when the image is missing or cannot be encoded:
	 * the adapter then paints the color instead.
	 */
	async pattern(
		name: unknown,
		tile?: (display: { width: number; height: number }) => PatternTile
	): Promise<PatternPaint | undefined> {
		const found = this.images.find(name);
		if (!found) return undefined;
		const href = await this.images.url(found);
		if (!href) return undefined;
		const display = displaySize(found.image);
		const size: PatternTile = tile ? tile(display) : display;
		const pattern = patternOf(this.document, href, size.width, size.height, size.x, size.y);
		return { paint: pattern.paint, defs: pattern.element };
	}
}
