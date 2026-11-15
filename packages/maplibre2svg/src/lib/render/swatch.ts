import type { LegendRamp } from '../core/types';
import type { RenderContext } from './context';
import { fmt, type Attrs } from './svg';

/** A symbol of the legend: an `<svg>` with `width`, `height` and `viewBox` */
export interface RenderedSymbol {
	svg: SVGSVGElement;
	width: number;
	height: number;
	/** the ramp, for the symbols of color ramps */
	ramp?: LegendRamp;
}

/** Color of the frame of area symbols: mid grey, which reads on light and dark pages */
export const FRAME_COLOR = 'rgba(128,128,128,0.45)';

/**
 * Builds the `<svg>` of one symbol: the definitions (gradients, patterns, clips) go into one
 * `<defs>` first, then the shapes in the order they are added.
 *
 * ```ts
 * return ctx.swatch(30, 20).define(gradient).add(rect).addFrame().build();
 * ```
 */
export class Swatch {
	readonly width: number;
	readonly height: number;
	readonly #ctx: RenderContext;
	readonly #defs: Element[] = [];
	readonly #nodes: Node[] = [];

	constructor(ctx: RenderContext, width: number, height: number) {
		this.#ctx = ctx;
		this.width = width;
		this.height = height;
	}

	/** Whether the host wants the neutral frame around area symbols */
	get framed(): boolean {
		return this.#ctx.swatch.frame;
	}

	/** Add definitions, such as a `<linearGradient>`; undefined ones are skipped */
	define(...elements: (Element | undefined)[]): this {
		for (const element of elements) if (element) this.#defs.push(element);
		return this;
	}

	/** Add shapes; undefined ones are skipped */
	add(...nodes: (Node | undefined)[]): this {
		for (const node of nodes) if (node) this.#nodes.push(node);
		return this;
	}

	/**
	 * Add a 1px neutral frame at the edge, so that very light or translucent areas still show.
	 * It does not take the opacity of the layer. Nothing when the host turned it off.
	 */
	addFrame(): this {
		if (this.framed) {
			this.add(this.insetRect({ fill: 'none', stroke: FRAME_COLOR, 'stroke-width': 1 }));
		}
		return this;
	}

	/** An SVG element in the document of the swatch */
	el(name: string, attrs: Attrs = {}, children: Node[] = []): SVGElement {
		return this.#ctx.svg.el(name, attrs, children);
	}

	/** A rectangle inset by half a pixel, the area of the swatch, with the attributes */
	insetRect(attrs: Attrs): SVGElement {
		return this.el('rect', {
			x: 0.5,
			y: 0.5,
			width: this.width - 1,
			height: this.height - 1,
			...attrs
		});
	}

	/** The `<svg>`, its size rounded up to whole pixels */
	build(): RenderedSymbol {
		const w = Math.ceil(this.width);
		const h = Math.ceil(this.height);
		const children = [...this.#ctx.svg.defs(this.#defs), ...this.#nodes];
		return { svg: this.#ctx.svg.svg(w, h, children), width: w, height: h };
	}

	/**
	 * Widen a symbol to the width, keeping its content in the middle, so that the symbols of
	 * one layer line up
	 */
	static widen(symbol: RenderedSymbol, width: number): RenderedSymbol {
		if (symbol.width >= width) return symbol;
		const dx = (width - symbol.width) / 2;
		symbol.svg.setAttribute('width', fmt(width));
		symbol.svg.setAttribute('viewBox', `${fmt(-dx)} 0 ${fmt(width)} ${fmt(symbol.height)}`);
		return { ...symbol, width };
	}
}
