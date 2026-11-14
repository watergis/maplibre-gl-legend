import type { EvaluatedLayer } from '../expression';
import { el } from '../svg';
import { frame, layerOpacity, opacity, paintColor, swatch } from './common';
import { patternPaint } from './pattern-paint';
import type { RenderContext, RenderedSymbol } from './types';

/**
 * A rectangle of `background-color` (or `background-pattern`) × `background-opacity`, filling
 * the swatch, with the neutral frame around it
 */
export async function renderBackground(
	layer: EvaluatedLayer,
	ctx: RenderContext
): Promise<RenderedSymbol> {
	const { width, height } = ctx.swatch;
	const layerAlpha = opacity(layer.paint['background-opacity']) * layerOpacity(layer);
	const pattern = await patternPaint(ctx, layer.paint['background-pattern']);
	const color = paintColor(layer.paint['background-color'], layerAlpha);
	const rect = el(ctx.document, 'rect', {
		x: 0,
		y: 0,
		width,
		height,
		fill: pattern ? pattern.paint : color.color,
		'fill-opacity': pattern ? layerAlpha : color.opacity
	});
	const border = frame(ctx, width, height);
	const defs = pattern ? [el(ctx.document, 'defs', {}, [pattern.defs])] : [];
	return swatch(ctx, width, height, [...defs, rect, ...(border ? [border] : [])]);
}
