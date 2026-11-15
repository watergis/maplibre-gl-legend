import {
	layerOpacity,
	paintColor,
	paintNumber,
	type RenderContext,
	type RenderedSymbol
} from '../render';
import type { EvaluatedLayer } from '../style';
import { LayerAdapter } from './layer-adapter';

/** The radius of a circle, the width of its stroke, and both together */
export interface CircleGeometry {
	radius: number;
	stroke: number;
	outer: number;
}

/**
 * The radius of the circle and the width of its stroke, which lies outside the radius as in
 * MapLibre, scaled down together so that the whole circle fits `maxSize`
 */
export function circleGeometry(layer: EvaluatedLayer, maxSize: number): CircleGeometry {
	let radius = Math.max(0, paintNumber(layer, 'circle-radius', 5));
	let stroke = Math.max(0, paintNumber(layer, 'circle-stroke-width', 0));
	const outer = radius + stroke;
	if (outer > maxSize / 2) {
		const scale = maxSize / 2 / outer;
		radius *= scale;
		stroke *= scale;
	}
	return { radius, stroke, outer: radius + stroke };
}

/**
 * `circle`: a circle at the real `circle-radius` with its stroke outside the radius. The
 * swatch grows with the circle, up to `maxSize`, so that classes of different radii differ in
 * size.
 */
export class CircleAdapter extends LayerAdapter {
	readonly type = 'circle';
	readonly geometryType = 'Point';
	readonly classificationAxes = [
		['paint', 'circle-color'],
		['paint', 'circle-radius'],
		['paint', 'circle-stroke-color']
	] as const;

	render(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
		const size = ctx.swatch;
		const { radius, stroke, outer } = circleGeometry(layer, size.maxSize);
		const width = Math.max(size.width, Math.ceil(2 * outer) + 2);
		const height = Math.max(size.height, Math.ceil(2 * outer) + 2);
		const [cx, cy] = [width / 2, height / 2];
		const swatch = ctx.createSwatch(width, height);
		const fill = paintColor(
			layer.paint['circle-color'],
			layer.paint['circle-opacity'],
			layerOpacity(layer)
		);
		swatch.add(
			swatch.el('circle', { cx, cy, r: radius, fill: fill.color, 'fill-opacity': fill.opacity })
		);
		if (stroke > 0) {
			const color = paintColor(
				layer.paint['circle-stroke-color'],
				layer.paint['circle-stroke-opacity'],
				layerOpacity(layer)
			);
			swatch.add(
				swatch.el('circle', {
					cx,
					cy,
					r: radius + stroke / 2,
					fill: 'none',
					stroke: color.color,
					'stroke-opacity': color.opacity,
					'stroke-width': stroke
				})
			);
		}
		return swatch.build();
	}
}
