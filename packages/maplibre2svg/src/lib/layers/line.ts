import type { EvaluatedLayer } from '../expression';
import { el, fmt } from '../svg';
import { clamp, crisp, layerOpacity, opacity, paintColor, paintNumber, swatch } from './common';
import { dashPattern, fitDashes } from './line-dash';
import { lineGradient } from './line-gradient';
import { patternPaint } from './pattern-paint';
import type { RenderContext, RenderedSymbol } from './types';

/**
 * The width of the line(s), the gap, and the centers of the lines, scaled down together to
 * fit the height. The centers are snapped for crisp strokes and then kept at least half a
 * stroke from the edges, so that no line is clipped.
 */
export function lineGeometry(layer: EvaluatedLayer, height: number) {
	let width = clamp(paintNumber(layer, 'line-width', 1), 0.5, height);
	let gap = Math.max(0, paintNumber(layer, 'line-gap-width', 0));
	if (gap > 0 && 2 * width + gap > height) {
		const scale = height / (2 * width + gap);
		width = Math.max(0.5, width * scale);
		gap = Math.max(0, height - 2 * width);
	}
	const offsets = gap > 0 ? [-(gap + width) / 2, (gap + width) / 2] : [0];
	const centers = offsets.map((offset) =>
		clamp(crisp(height / 2 + offset, width), width / 2, height - width / 2)
	);
	return { width, gap, centers };
}

/** The stroke of the line: `line-gradient` when set, else `line-color` */
function lineStroke(layer: EvaluatedLayer, doc: Document, x1: number, x2: number) {
	const alpha = opacity(layer.paint['line-opacity'], layerOpacity(layer));
	const gradient = lineGradient(doc, layer, x1, x2);
	if (gradient) {
		return {
			attrs: { stroke: `url(#${gradient.id})`, 'stroke-opacity': alpha },
			defs: [gradient.element]
		};
	}
	const color = paintColor(layer.paint['line-color'], alpha);
	return { attrs: { stroke: color.color, 'stroke-opacity': color.opacity }, defs: [] as Element[] };
}

/**
 * `line-pattern`: the image scaled to the line width, as MapLibre does, along bands of the
 * line(s). Undefined when there is no image.
 */
async function patternLines(
	layer: EvaluatedLayer,
	ctx: RenderContext,
	width: number,
	centers: number[]
) {
	const swatchWidth = ctx.swatch.width;
	const bands: Element[] = [];
	const defs: Element[] = [];
	for (const y of centers) {
		const pattern = await patternPaint(ctx, layer.paint['line-pattern'], (size) => ({
			width: (size.width * width) / size.height,
			height: width,
			y: y - width / 2
		}));
		if (!pattern) return undefined;
		defs.push(pattern.defs);
		bands.push(
			el(ctx.document, 'rect', {
				x: 0,
				y: y - width / 2,
				width: swatchWidth,
				height: width,
				fill: pattern.paint,
				'fill-opacity': opacity(layer.paint['line-opacity'], layerOpacity(layer))
			})
		);
	}
	return { bands, defs };
}

/**
 * A horizontal line at the real `line-width`: `line-cap`, `line-join`, `line-dasharray`
 * (widening the swatch to show two dash periods), `line-gap-width` as two parallel lines,
 * `line-opacity`, `line-gradient` and `line-pattern`.
 */
export async function renderLine(
	layer: EvaluatedLayer,
	ctx: RenderContext
): Promise<RenderedSymbol> {
	const { swatch: size, document: doc } = ctx;
	const { width, centers } = lineGeometry(layer, size.height);
	const patterned = await patternLines(layer, ctx, width, centers);
	if (patterned) {
		return swatch(ctx, size.width, size.height, [
			el(doc, 'defs', {}, patterned.defs),
			...patterned.bands
		]);
	}
	const cap = String(layer.layout['line-cap'] ?? 'butt');
	// round and square caps reach half the width past the ends
	const ends = cap === 'butt' ? 0 : width;
	let dashes = dashPattern(layer.paint['line-dasharray'], width);
	let swatchWidth = size.width;
	if (dashes) {
		const fitted = fitDashes(dashes, size.width, Math.max(size.width, size.maxSize * 2), ends);
		swatchWidth = fitted.width;
		dashes = fitted.pattern;
	}
	const [x1, x2] = [ends / 2, swatchWidth - ends / 2];
	const stroke = lineStroke(layer, doc, x1, x2);
	const lines = centers.map((y) =>
		el(doc, 'line', {
			x1,
			y1: y,
			x2,
			y2: y,
			...stroke.attrs,
			'stroke-width': width,
			'stroke-linecap': cap,
			'stroke-linejoin': String(layer.layout['line-join'] ?? 'miter'),
			'stroke-dasharray': dashes?.dashes.map(fmt).join(' '),
			'stroke-dashoffset': dashes && dashes.offset > 0 ? dashes.offset : undefined
		})
	);
	const defs = stroke.defs.length > 0 ? [el(doc, 'defs', {}, stroke.defs)] : [];
	return swatch(ctx, swatchWidth, size.height, [...defs, ...lines]);
}
