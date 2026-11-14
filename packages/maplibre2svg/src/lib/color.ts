import { Color } from './style-spec';

export interface CssColor {
	/** opaque color, e.g. `#ff0000` */
	color: string;
	/** alpha of the color, 0..1 */
	opacity: number;
}

const toHex = (value: number) =>
	Math.max(0, Math.min(255, Math.round(value * 255)))
		.toString(16)
		.padStart(2, '0');

function parse(value: unknown): Color | undefined {
	if (value instanceof Color) return value;
	if (typeof value === 'string') return Color.parse(value);
	if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
		// a plain object in the shape of `Color`: premultiplied 0..1 channels
		const { r, g, b, a = 1 } = value as { r: number; g: number; b: number; a?: number };
		return new Color(r, g, b, a);
	}
	return undefined;
}

/**
 * Convert a color of the style, either a style-spec `Color` or a CSS color string such as an
 * evaluated property holds, to an opaque CSS color and its alpha.
 */
export function toCssColor(value: unknown, fallback = '#000000'): CssColor {
	const color = parse(value) ?? parse(fallback) ?? Color.black;
	const [r, g, b, a] = color.rgb;
	if (a <= 0) return { color: '#000000', opacity: 0 };
	return { color: `#${toHex(r)}${toHex(g)}${toHex(b)}`, opacity: a };
}
