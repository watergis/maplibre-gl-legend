import type { EvaluatedLayer } from '../expression';
import { el, fmt } from '../svg';
import { clamp, crisp, layerOpacity, opacity, paintColor, paintNumber, swatch } from './common';
import { dashArray, fitDashes } from './line-dash';
import { lineGradient } from './line-gradient';
import type { RenderContext, RenderedSymbol } from './types';

/** The widths of the line(s) and the gap, scaled down together to fit the height */
function lineGeometry(layer: EvaluatedLayer, height: number) {
	let width = clamp(paintNumber(layer, 'line-width', 1), 0.5, height);
	let gap = Math.max(0, paintNumber(layer, 'line-gap-width', 0));
	if (gap > 0 && 2 * width + gap > height) {
		const scale = height / (2 * width + gap);
		width = Math.max(0.5, width * scale);
		gap = Math.max(0, height - 2 * width);
	}
	return { width, gap };
}

/**
 * A horizontal line at the real `line-width`: `line-cap`, `line-join`, `line-dasharray`
 * (widening the swatch to show two dash periods), `line-gap-width` as two parallel lines,
 * `line-opacity` and `line-gradient`. `line-pattern` comes with the sprite images later.
 */
export function renderLine(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const { swatch: size, document: doc } = ctx;
	const { width, gap } = lineGeometry(layer, size.height);
	const cap = String(layer.layout['line-cap'] ?? 'butt');
	// round and square caps reach half the width past the ends
	const ends = cap === 'butt' ? 0 : width;
	let dashes = dashArray(layer.paint['line-dasharray'], width);
	let swatchWidth = size.width;
	if (dashes) {
		const fitted = fitDashes(dashes, size.width, Math.max(size.width, size.maxSize * 2), ends);
		swatchWidth = fitted.width;
		dashes = fitted.dashes;
	}
	const [x1, x2] = [ends / 2, swatchWidth - ends / 2];
	const gradient = lineGradient(doc, layer, x1, x2);
	const color = paintColor(
		layer.paint['line-color'],
		layer.paint['line-opacity'],
		layerOpacity(layer)
	);
	const stroke = gradient
		? {
				stroke: `url(#${gradient.id})`,
				'stroke-opacity': opacity(layer.paint['line-opacity'], layerOpacity(layer))
			}
		: { stroke: color.color, 'stroke-opacity': color.opacity };

	const centers = gap > 0 ? [-(gap + width) / 2, (gap + width) / 2] : [0];
	const lines = centers.map((offset) => {
		const y = crisp(size.height / 2 + offset, width);
		return el(doc, 'line', {
			x1,
			y1: y,
			x2,
			y2: y,
			...stroke,
			'stroke-width': width,
			'stroke-linecap': cap,
			'stroke-linejoin': String(layer.layout['line-join'] ?? 'miter'),
			'stroke-dasharray': dashes?.map(fmt).join(' ')
		});
	});
	const defs = gradient ? [el(doc, 'defs', {}, [gradient.element])] : [];
	return swatch(ctx, swatchWidth, size.height, [...defs, ...lines]);
}
