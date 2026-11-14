import type { EvaluatedLayer } from '../expression';
import { createSvg, el } from '../svg';
import type { SwatchOptions } from '../types';

/** What a renderer of a layer type is given besides the evaluated layer */
export interface RenderContext {
	document: Document;
	swatch: SwatchOptions;
}

/** A symbol of the legend */
export interface RenderedSymbol {
	svg: SVGSVGElement;
	width: number;
	height: number;
}

/**
 * A neutral symbol, for the layer types which have no renderer: a grey rectangle the size
 * of the swatch.
 */
export function renderDefault(_layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const { width, height } = ctx.swatch;
	const rect = el(ctx.document, 'rect', {
		x: 0.5,
		y: 0.5,
		width: width - 1,
		height: height - 1,
		fill: '#cccccc',
		stroke: '#999999',
		'stroke-width': 1
	});
	return { svg: createSvg(ctx.document, width, height, [rect]), width, height };
}
