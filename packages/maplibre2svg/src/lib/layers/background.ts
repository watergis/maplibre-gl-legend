import type { EvaluatedLayer } from '../expression';
import { el } from '../svg';
import { layerOpacity, paintColor, swatch } from './common';
import type { RenderContext, RenderedSymbol } from './types';

/**
 * A rectangle of `background-color` × `background-opacity`, filling the swatch.
 * `background-pattern` comes with the sprite images in a later step.
 */
export function renderBackground(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const { width, height } = ctx.swatch;
	const color = paintColor(
		layer.paint['background-color'],
		layer.paint['background-opacity'],
		layerOpacity(layer)
	);
	const rect = el(ctx.document, 'rect', {
		x: 0,
		y: 0,
		width,
		height,
		fill: color.color,
		'fill-opacity': color.opacity
	});
	return swatch(ctx, width, height, [rect]);
}
