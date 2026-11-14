import { toCssColor } from '../color';
import type { EvaluatedLayer } from '../expression';
import { createSvg, el, fmt } from '../svg';
import type { RenderContext, RenderedSymbol } from './types';

export const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

/** A finite number from an evaluated value, or the fallback */
export function numberOf(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A paint property as a number */
export const paintNumber = (layer: EvaluatedLayer, name: string, fallback: number) =>
	numberOf(layer.paint[name], fallback);

/** Product of opacities, each clamped to 0..1 */
export function opacity(...values: unknown[]): number {
	return values.reduce<number>((product, value) => product * clamp(numberOf(value, 1), 0, 1), 1);
}

/** The opacity of the whole layer, `<type>-layer-opacity`, 1 when the type has none */
export const layerOpacity = (layer: EvaluatedLayer) =>
	opacity(layer.paint[`${layer.type}-layer-opacity`]);

/**
 * A color of the style as an SVG paint and its opacity, composed with the opacities given,
 * e.g. `fill-color` with `fill-opacity`
 */
export function paintColor(value: unknown, ...opacities: unknown[]) {
	const css = toCssColor(value);
	return { color: css.color, opacity: opacity(css.opacity, ...opacities) };
}

/**
 * Snap a coordinate so that a stroke of the width is crisp: an odd integer width needs a
 * center on a half pixel, an even one on a whole pixel
 */
export function crisp(value: number, strokeWidth: number) {
	const odd =
		Math.round(strokeWidth) % 2 === 1 && Math.abs(strokeWidth - Math.round(strokeWidth)) < 1e-6;
	return odd ? Math.floor(value) + 0.5 : Math.round(value);
}

/** The swatch: an `<svg>` of the size, with the children */
export function swatch(
	ctx: RenderContext,
	width: number,
	height: number,
	children: Node[]
): RenderedSymbol {
	const w = Math.ceil(width);
	const h = Math.ceil(height);
	return { svg: createSvg(ctx.document, w, h, children), width: w, height: h };
}

/**
 * Widen a symbol to the width, keeping its content in the middle, so that the symbols of
 * one layer line up
 */
export function widen(symbol: RenderedSymbol, width: number): RenderedSymbol {
	if (symbol.width >= width) return symbol;
	const dx = (width - symbol.width) / 2;
	symbol.svg.setAttribute('width', fmt(width));
	symbol.svg.setAttribute('viewBox', `${fmt(-dx)} 0 ${fmt(width)} ${fmt(symbol.height)}`);
	return { ...symbol, width };
}

/** Color of the frame of area symbols: mid grey, which reads on light and dark pages */
export const FRAME_COLOR = 'rgba(128,128,128,0.45)';

/**
 * A 1px neutral frame at the edge of an area symbol, so that very light or translucent areas
 * still show. It does not take the opacity of the layer. Undefined when the host turned it off.
 */
export function frame(ctx: RenderContext, width: number, height: number): Element | undefined {
	if (!ctx.swatch.frame) return undefined;
	return el(ctx.document, 'rect', {
		x: 0.5,
		y: 0.5,
		width: width - 1,
		height: height - 1,
		fill: 'none',
		stroke: FRAME_COLOR,
		'stroke-width': 1
	});
}
