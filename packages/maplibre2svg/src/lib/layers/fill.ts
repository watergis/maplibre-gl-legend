import type { EvaluatedLayer } from '../expression';
import { el } from '../svg';
import { layerOpacity, opacity, paintColor, swatch } from './common';
import type { RenderContext, RenderedSymbol } from './types';

/** Width of the outline, as MapLibre draws it */
const OUTLINE_WIDTH = 1;

/**
 * The outline of a fill: `fill-outline-color` when set, else the fill color, drawn only when
 * `fill-antialias` is on, as MapLibre does. Undefined when there is none.
 */
export function fillOutline(layer: EvaluatedLayer, fillOpacity: number) {
	if (layer.paint['fill-antialias'] === false) return undefined;
	const value = layer.paint['fill-outline-color'] ?? layer.paint['fill-color'];
	return paintColor(value, fillOpacity);
}

/**
 * The paint of the area. `fill-pattern` is drawn with the images of the sprite, which come
 * in a later step; until then the color stands in for it.
 */
export function fillPaint(layer: EvaluatedLayer, fillOpacity: number) {
	const color = paintColor(layer.paint['fill-color'], fillOpacity);
	return { fill: color.color, 'fill-opacity': color.opacity };
}

/**
 * A rectangle of `fill-color` × `fill-opacity`, with a 1px outline inset by half a pixel so
 * that the edge of the SVG does not clip it
 */
export function renderFill(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const { width, height } = ctx.swatch;
	const fillOpacity = opacity(layer.paint['fill-opacity']) * layerOpacity(layer);
	const outline = fillOutline(layer, fillOpacity);
	const inset = OUTLINE_WIDTH / 2;
	const rect = el(ctx.document, 'rect', {
		x: inset,
		y: inset,
		width: width - OUTLINE_WIDTH,
		height: height - OUTLINE_WIDTH,
		...fillPaint(layer, fillOpacity),
		stroke: outline?.color,
		'stroke-opacity': outline?.opacity,
		'stroke-width': outline ? OUTLINE_WIDTH : undefined
	});
	return swatch(ctx, width, height, [rect]);
}
