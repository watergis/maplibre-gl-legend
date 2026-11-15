import {
	Color,
	ColorArray,
	Formatted,
	NumberArray,
	Padding,
	ResolvedImage,
	VariableAnchorOffsetCollection
} from './style-spec';
import type { StylePropertySpecification } from 'maplibre-gl';

/**
 * Whether an evaluated value has the type of the property. A value which is neither a
 * function nor an expression, such as `["no-such-operator"]`, is taken as a constant by the
 * style-spec without any check, so it is checked here.
 */
export function hasSpecType(value: unknown, spec: StylePropertySpecification): boolean {
	switch (spec.type) {
		case 'color':
			return value instanceof Color;
		case 'number':
			return typeof value === 'number' && Number.isFinite(value);
		case 'boolean':
			return typeof value === 'boolean';
		case 'string':
			return typeof value === 'string';
		case 'enum':
			return typeof value === 'string' && Object.prototype.hasOwnProperty.call(spec.values, value);
		case 'array':
			return Array.isArray(value) && value.every((item) => typeof item === spec.value);
		case 'padding':
			return value instanceof Padding;
		case 'numberArray':
			return value instanceof NumberArray;
		case 'colorArray':
			return value instanceof ColorArray;
		case 'variableAnchorOffsetCollection':
			return value instanceof VariableAnchorOffsetCollection;
		default:
			break;
	}
	// types which the union of the specification leaves out, such as `resolvedImage`
	const type = (spec as { type: string }).type;
	if (type === 'resolvedImage') return value instanceof ResolvedImage || typeof value === 'string';
	if (type === 'formatted') return value instanceof Formatted || typeof value === 'string';
	return true;
}
