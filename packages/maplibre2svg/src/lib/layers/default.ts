import type { EvaluatedLayer } from '../expression';
import { el } from '../svg';
import { swatch } from './common';
import type { RenderContext, RenderedSymbol } from './types';

/**
 * A neutral symbol, for the layer types which have no renderer: a grey rectangle the size
 * of the swatch
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
	return swatch(ctx, width, height, [rect]);
}
