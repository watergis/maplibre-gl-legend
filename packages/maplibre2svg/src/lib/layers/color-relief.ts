import type { EvaluatedLayer } from '../expression';
import { el } from '../svg';
import { frame, layerOpacity, opacity, paintColor, swatch } from './common';
import { renderDefault } from './default';
import type { RenderContext, RenderedSymbol } from './types';

/**
 * One class of `color-relief`: an area swatch of the color of its elevation (a stop of an
 * `interpolate`, an interval of a `step`), with `color-relief-opacity` and the neutral frame.
 * Without a class, the color has no single value: the neutral symbol.
 */
export function renderColorRelief(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const value = layer.paint['color-relief-color'];
	if (value === undefined) return renderDefault(layer, ctx);
	const { width, height } = ctx.swatch;
	const color = paintColor(
		value,
		opacity(layer.paint['color-relief-opacity']) * layerOpacity(layer)
	);
	const rect = el(ctx.document, 'rect', {
		x: 0.5,
		y: 0.5,
		width: width - 1,
		height: height - 1,
		fill: color.color,
		'fill-opacity': color.opacity
	});
	const border = frame(ctx, width, height);
	return swatch(ctx, width, height, [rect, ...(border ? [border] : [])]);
}
