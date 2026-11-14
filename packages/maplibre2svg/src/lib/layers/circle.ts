import type { EvaluatedLayer } from '../expression';
import { el } from '../svg';
import { layerOpacity, paintColor, paintNumber, swatch } from './common';
import type { RenderContext, RenderedSymbol } from './types';

/**
 * The radius of the circle and the width of its stroke, which lies outside the radius as in
 * MapLibre, scaled down together so that the whole circle fits `maxSize`
 */
export function circleGeometry(layer: EvaluatedLayer, maxSize: number) {
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
 * A circle at the real `circle-radius` with its stroke outside the radius. The swatch grows
 * with the circle, up to `maxSize`, so that classes of different radii differ in size.
 */
export function renderCircle(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const { swatch: size, document: doc } = ctx;
	const { radius, stroke, outer } = circleGeometry(layer, size.maxSize);
	const width = Math.max(size.width, Math.ceil(2 * outer) + 2);
	const height = Math.max(size.height, Math.ceil(2 * outer) + 2);
	const [cx, cy] = [width / 2, height / 2];
	const fill = paintColor(
		layer.paint['circle-color'],
		layer.paint['circle-opacity'],
		layerOpacity(layer)
	);
	const children: Element[] = [
		el(doc, 'circle', { cx, cy, r: radius, fill: fill.color, 'fill-opacity': fill.opacity })
	];
	if (stroke > 0) {
		const color = paintColor(
			layer.paint['circle-stroke-color'],
			layer.paint['circle-stroke-opacity'],
			layerOpacity(layer)
		);
		children.push(
			el(doc, 'circle', {
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
	return swatch(ctx, width, height, children);
}
