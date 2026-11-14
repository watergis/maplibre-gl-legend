import type { EvaluatedLayer } from '../expression';
import { el } from '../svg';
import { frame, layerOpacity, opacity, paintColor, swatch } from './common';
import { patternPaint } from './pattern-paint';
import type { RenderContext, RenderedSymbol } from './types';

/** Width of the outline, as MapLibre draws it */
const OUTLINE_WIDTH = 1;

/**
 * The outline of a fill as MapLibre draws it: `fill-outline-color` when set, else the fill
 * color, and only when `fill-antialias` is on. `distinct` tells whether it differs from the
 * fill, i.e. whether it is a border of its own. Undefined when there is none.
 */
export function fillOutline(layer: EvaluatedLayer, fillOpacity: number) {
	if (layer.paint['fill-antialias'] === false) return undefined;
	const fill = paintColor(layer.paint['fill-color'], fillOpacity);
	const explicit = layer.paint['fill-outline-color'];
	if (explicit === undefined) return { ...fill, distinct: false };
	const outline = paintColor(explicit, fillOpacity);
	const distinct = outline.color !== fill.color || outline.opacity !== fill.opacity;
	return { ...outline, distinct };
}

/**
 * The paint of the area: the image of `fill-pattern` when there is one, else `fill-color`.
 * Both carry `fill-opacity`.
 */
export async function fillPaint(layer: EvaluatedLayer, ctx: RenderContext, fillOpacity: number) {
	const pattern = await patternPaint(ctx, layer.paint['fill-pattern']);
	if (pattern)
		return { attrs: { fill: pattern.paint, 'fill-opacity': fillOpacity }, defs: [pattern.defs] };
	const color = paintColor(layer.paint['fill-color'], fillOpacity);
	return { attrs: { fill: color.color, 'fill-opacity': color.opacity }, defs: [] };
}

/**
 * A rectangle of `fill-color` × `fill-opacity` (or `fill-pattern`). An outline of its own color
 * is drawn 1px wide, inset by half a pixel so that the edge of the SVG does not clip it.
 * Otherwise the neutral frame stands in for the outline of the fill color, which would vanish
 * for a light fill; without the frame, that outline is drawn as MapLibre does.
 */
export async function renderFill(
	layer: EvaluatedLayer,
	ctx: RenderContext
): Promise<RenderedSymbol> {
	const { width, height } = ctx.swatch;
	const fillOpacity = opacity(layer.paint['fill-opacity']) * layerOpacity(layer);
	const outline = fillOutline(layer, fillOpacity);
	const border = outline?.distinct ? undefined : frame(ctx, width, height);
	const stroke = outline && (outline.distinct || !border) ? outline : undefined;
	const paint = await fillPaint(layer, ctx, fillOpacity);
	const inset = OUTLINE_WIDTH / 2;
	const rect = el(ctx.document, 'rect', {
		x: inset,
		y: inset,
		width: width - OUTLINE_WIDTH,
		height: height - OUTLINE_WIDTH,
		...paint.attrs,
		stroke: stroke?.color,
		'stroke-opacity': stroke?.opacity,
		'stroke-width': stroke ? OUTLINE_WIDTH : undefined
	});
	const defs = paint.defs.length > 0 ? [el(ctx.document, 'defs', {}, paint.defs)] : [];
	return swatch(ctx, width, height, [...defs, rect, ...(border ? [border] : [])]);
}
