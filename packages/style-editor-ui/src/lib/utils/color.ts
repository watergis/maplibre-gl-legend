import { Color } from '@maplibre/maplibre-gl-style-spec';

/** a color as the color input edits it */
export interface EditableColor {
	/** `#rrggbb` */
	hex: string;
	/** 0..1 */
	alpha: number;
}

const toHex = (v: number) =>
	Math.round(Math.min(Math.max(v, 0), 1) * 255)
		.toString(16)
		.padStart(2, '0');

/**
 * Parse a constant color of a style: a CSS color string, or an `rgb` / `rgba` expression of
 * numbers.
 *
 * @param value the value
 * @returns the color, or `undefined` when it is not a constant color
 */
export function parseColor(value: unknown): EditableColor | undefined {
	let input: string | undefined;
	if (typeof value === 'string') {
		input = value;
	} else if (
		Array.isArray(value) &&
		(value[0] === 'rgb' || value[0] === 'rgba') &&
		value.slice(1).every((v) => typeof v === 'number')
	) {
		input = `${value[0]}(${value.slice(1).join(',')})`;
	}
	if (input === undefined) return;
	const color = Color.parse(input);
	if (!color) return;
	const [r, g, b, a] = color.rgb;
	return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, alpha: Math.round(a * 100) / 100 };
}

/**
 * Write a color for the style: `#rrggbb` when it is opaque, `rgba(...)` otherwise.
 *
 * @param color the color
 * @returns a CSS color string
 */
export function formatColor(color: EditableColor): string {
	if (color.alpha >= 1) return color.hex;
	const n = parseInt(color.hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${color.alpha})`;
}
