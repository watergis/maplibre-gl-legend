import {
	fmt,
	layerOpacity,
	opacity,
	paintColor,
	paintNumber,
	type RenderContext,
	type RenderedSymbol
} from '../render';
import type { EvaluatedLayer } from '../style';
import { shade } from '../util/color';
import { LayerAdapter } from './layer-adapter';

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

type Point = [number, number];

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

const points = (list: Point[]) => list.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ');

/**
 * `fill-extrusion`: an isometric box. The top face is in `fill-extrusion-color` (or
 * `fill-extrusion-pattern`), the two side faces in darker shades of the color, and the height
 * is relative to the other classes of the layer.
 */
export class FillExtrusionAdapter extends LayerAdapter {
	readonly type = 'fill-extrusion';
	readonly geometryType = 'Polygon';
	readonly classificationAxes = [['paint', 'fill-extrusion-color']] as const;

	async render(layer: EvaluatedLayer, ctx: RenderContext): Promise<RenderedSymbol> {
		const size = ctx.swatch;
		const h = boxHeight(layer, ctx.siblings);
		const total = 2 * DY + h;
		const width = Math.max(size.width, 2 * DX + 2);
		const height = Math.max(size.height, Math.ceil(total) + 2);
		const cx = width / 2;
		const top = (height - total) / 2;
		const n: Point = [cx, top];
		const e: Point = [cx + DX, top + DY];
		const s: Point = [cx, top + 2 * DY];
		const w: Point = [cx - DX, top + DY];
		const down = ([x, y]: Point): Point => [x, y + h];
		const color = paintColor(layer.paint['fill-extrusion-color']);
		const pattern = await ctx.pattern(layer.paint['fill-extrusion-pattern']);
		const swatch = ctx.createSwatch(width, height);
		const face = (list: Point[], fill: string, edge = fill) =>
			swatch.el('polygon', {
				points: points(list),
				fill,
				stroke: edge,
				'stroke-width': 0.5,
				'stroke-linejoin': 'round'
			});
		const alpha = opacity(
			color.opacity,
			layer.paint['fill-extrusion-opacity'],
			layerOpacity(layer)
		);
		return swatch
			.define(pattern?.defs)
			.add(
				swatch.el('g', { opacity: alpha }, [
					face([w, s, down(s), down(w)], shade(color.color, SIDE_SHADES.left)),
					face([s, e, down(e), down(s)], shade(color.color, SIDE_SHADES.right)),
					// the top face shows `fill-extrusion-pattern` when there is one
					face([n, e, s, w], pattern ? pattern.paint : color.color, color.color)
				])
			)
			.build();
	}
}
