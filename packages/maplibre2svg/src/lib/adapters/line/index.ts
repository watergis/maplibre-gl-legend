import {
	crisp,
	fmt,
	layerOpacity,
	opacity,
	paintColor,
	paintNumber,
	type RenderContext,
	type RenderedSymbol
} from '../../render';
import type { EvaluatedLayer } from '../../style';
import { clamp } from '../../util/number';
import { LayerAdapter } from '../base/layer-adapter';
import { dashPattern, fitDashes } from './dash';
import { lineGradient } from './gradient';

/** The width of the line(s), the gap between two, and the centers of the lines */
export interface LineGeometry {
	width: number;
	gap: number;
	centers: number[];
}

/**
 * The width of the line(s), the gap, and the centers of the lines, scaled down together to
 * fit the height. The centers are snapped for crisp strokes and then kept at least half a
 * stroke from the edges, so that no line is clipped.
 */
export function lineGeometry(layer: EvaluatedLayer, height: number): LineGeometry {
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

/**
 * `line`: a horizontal line at the real `line-width`, with `line-cap`, `line-join`,
 * `line-dasharray` (widening the swatch to show two dash periods), `line-gap-width` as two
 * parallel lines, `line-opacity`, `line-gradient` and `line-pattern`
 */
export class LineAdapter extends LayerAdapter {
	readonly type = 'line';
	readonly geometryType = 'LineString';
	readonly classificationAxes = [
		['paint', 'line-color'],
		['paint', 'line-pattern'],
		['paint', 'line-width'],
		['paint', 'line-dasharray']
	] as const;

	async render(layer: EvaluatedLayer, ctx: RenderContext): Promise<RenderedSymbol> {
		const size = ctx.swatch;
		const { width, centers } = lineGeometry(layer, size.height);
		const patterned = await this.patternLines(layer, ctx, width, centers);
		if (patterned) return patterned;
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
		const swatch = ctx.createSwatch(swatchWidth, size.height);
		const stroke = this.stroke(layer, ctx, x1, x2);
		swatch.define(stroke.defs);
		for (const y of centers) {
			swatch.add(
				swatch.el('line', {
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
		}
		return swatch.build();
	}

	/** The opacity of the line: `line-opacity` × the opacity of the layer */
	protected alpha(layer: EvaluatedLayer): number {
		return opacity(layer.paint['line-opacity'], layerOpacity(layer));
	}

	/** The stroke of the line: `line-gradient` when set, else `line-color` */
	protected stroke(layer: EvaluatedLayer, ctx: RenderContext, x1: number, x2: number) {
		const alpha = this.alpha(layer);
		const gradient = lineGradient(ctx.document, layer, x1, x2, this.geometryType);
		if (gradient) {
			return {
				attrs: { stroke: `url(#${gradient.id})`, 'stroke-opacity': alpha },
				defs: gradient.element
			};
		}
		const color = paintColor(layer.paint['line-color'], alpha);
		return { attrs: { stroke: color.color, 'stroke-opacity': color.opacity }, defs: undefined };
	}

	/**
	 * `line-pattern`: the image scaled to the line width, as MapLibre does, along bands of the
	 * line(s). Undefined when there is no image.
	 */
	protected async patternLines(
		layer: EvaluatedLayer,
		ctx: RenderContext,
		width: number,
		centers: number[]
	): Promise<RenderedSymbol | undefined> {
		const swatch = ctx.createSwatch(ctx.swatch.width, ctx.swatch.height);
		for (const y of centers) {
			const pattern = await ctx.pattern(layer.paint['line-pattern'], (size) => ({
				width: (size.width * width) / size.height,
				height: width,
				y: y - width / 2
			}));
			if (!pattern) return undefined;
			swatch.define(pattern.defs).add(
				swatch.el('rect', {
					x: 0,
					y: y - width / 2,
					width: ctx.swatch.width,
					height: width,
					fill: pattern.paint,
					'fill-opacity': this.alpha(layer)
				})
			);
		}
		return swatch.build();
	}
}
