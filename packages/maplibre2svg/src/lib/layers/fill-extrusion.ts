import { shade } from '../color';
import type { EvaluatedLayer } from '../expression';
import { el, fmt } from '../svg';
import { layerOpacity, opacity, paintColor, paintNumber, swatch } from './common';
import type { RenderContext, RenderedSymbol } from './types';

/** Half the width and half the depth of the top face, in pixels */
const DX = 11;
const DY = 5.5;
/** Height of the box when it does not vary between the classes */
const FIXED_HEIGHT = 10;
/** Range of heights which the classes are spread over */
const MIN_HEIGHT = 3;
const MAX_HEIGHT = 20;

/** Shades of the side faces, lit from the left as MapLibre does by default */
export const SIDE_SHADES = { left: 0.8, right: 0.6 } as const;

const extrusion = (layer: EvaluatedLayer) =>
	Math.max(
		0,
		paintNumber(layer, 'fill-extrusion-height', 0) - paintNumber(layer, 'fill-extrusion-base', 0)
	);

/** Height of the box in pixels, relative to the tallest class of the layer */
export function boxHeight(layer: EvaluatedLayer, siblings: EvaluatedLayer[]): number {
	const heights = siblings.map(extrusion);
	const tallest = Math.max(0, ...heights);
	if (siblings.length < 2 || tallest === 0 || heights.every((h) => h === heights[0])) {
		return FIXED_HEIGHT;
	}
	return MIN_HEIGHT + ((MAX_HEIGHT - MIN_HEIGHT) * extrusion(layer)) / tallest;
}

const points = (list: [number, number][]) => list.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ');

/**
 * An isometric box: the top face in `fill-extrusion-color`, the two side faces in darker
 * shades of it, and the height relative to the other classes of the layer
 */
export function renderFillExtrusion(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const { swatch: size, document: doc } = ctx;
	const h = boxHeight(layer, ctx.siblings);
	const total = 2 * DY + h;
	const width = Math.max(size.width, 2 * DX + 2);
	const height = Math.max(size.height, Math.ceil(total) + 2);
	const cx = width / 2;
	const top = (height - total) / 2;
	const n: [number, number] = [cx, top];
	const e: [number, number] = [cx + DX, top + DY];
	const s: [number, number] = [cx, top + 2 * DY];
	const w: [number, number] = [cx - DX, top + DY];
	const down = ([x, y]: [number, number]): [number, number] => [x, y + h];
	const color = paintColor(layer.paint['fill-extrusion-color']);
	const face = (list: [number, number][], fill: string) =>
		el(doc, 'polygon', {
			points: points(list),
			fill,
			stroke: fill,
			'stroke-width': 0.5,
			'stroke-linejoin': 'round'
		});
	const group = el(
		doc,
		'g',
		{ opacity: opacity(color.opacity, layer.paint['fill-extrusion-opacity'], layerOpacity(layer)) },
		[
			face([w, s, down(s), down(w)], shade(color.color, SIDE_SHADES.left)),
			face([s, e, down(e), down(s)], shade(color.color, SIDE_SHADES.right)),
			face([n, e, s, w], color.color)
		]
	);
	return swatch(ctx, width, height, [group]);
}
