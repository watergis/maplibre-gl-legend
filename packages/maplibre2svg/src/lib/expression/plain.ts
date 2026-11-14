import {
	Color,
	ColorArray,
	Formatted,
	NumberArray,
	Padding,
	ResolvedImage,
	VariableAnchorOffsetCollection
} from '../style-spec';

/**
 * Convert an evaluated value into plain data, so that renderers do not depend on the
 * classes of the style-spec:
 * - `Color` → CSS string `rgba(r,g,b,a)`
 * - `ResolvedImage` → image name
 * - `Formatted` → its text
 * - `Padding`, `NumberArray`, `VariableAnchorOffsetCollection` → their values
 * - `ColorArray` → CSS strings
 */
export function toPlain(value: unknown): unknown {
	if (value instanceof Color) return value.toString();
	if (value instanceof ResolvedImage) return value.name;
	if (value instanceof Formatted) return value.toString();
	if (value instanceof ColorArray) return value.values.map((color) => color.toString());
	if (
		value instanceof Padding ||
		value instanceof NumberArray ||
		value instanceof VariableAnchorOffsetCollection
	) {
		return value.values.map(toPlain);
	}
	if (Array.isArray(value)) return value.map(toPlain);
	return value;
}
