import type { EvaluatedLayer } from '../style';
import { toCssColor } from '../util/color';
import { clamp, numberOf } from '../util/number';

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

/** A color as an SVG paint and its opacity */
export interface Paint {
	color: string;
	opacity: number;
}

/**
 * A color of the style as an SVG paint and its opacity, composed with the opacities given,
 * e.g. `fill-color` with `fill-opacity`
 */
export function paintColor(value: unknown, ...opacities: unknown[]): Paint {
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
