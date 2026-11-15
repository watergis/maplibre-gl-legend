import { latest } from '@maplibre/maplibre-gl-style-spec';
import type { ArgTypes } from '@storybook/html-vite';

type InputType = ArgTypes[string];

/** The paint and layout properties which one story sets */
export interface LayerParts {
	paint?: Record<string, unknown>;
	layout?: Record<string, unknown>;
}

interface PropertySpec {
	type: string;
	value?: string;
	doc?: string;
	default?: unknown;
	minimum?: number;
	maximum?: number;
	units?: string;
	values?: Record<string, unknown>;
}

type Category = 'paint' | 'layout';

/** Properties which do not change a legend symbol */
const SKIPPED = new Set(['visibility']);

const spec = latest as unknown as Record<string, Record<string, PropertySpec> | undefined>;

/** The paint and layout properties of a layer type in the MapLibre style specification */
function properties(type: string): [Category, string, PropertySpec][] {
	return (['paint', 'layout'] as const).flatMap((category) =>
		Object.entries(spec[`${category}_${type}`] ?? {})
			.filter(([name]) => !SKIPPED.has(name))
			.map(([name, property]) => [category, name, property] as [Category, string, PropertySpec])
	);
}

/** A range for the numbers of a property, from its bounds and its units */
function range(property: PropertySpec) {
	const min = property.minimum ?? (property.units === 'degrees' ? 0 : undefined);
	let max = property.maximum;
	if (max === undefined) {
		if (property.units === 'degrees') max = 360;
		else if (property.units === 'ems') max = 2;
		else if (property.units === 'factor of the original icon size') max = 4;
		else max = Math.max(24, Number(property.default ?? 0) * 4);
	}
	const lower = min ?? -max;
	const span = max - lower;
	const step = span <= 2 ? 0.05 : span <= 10 ? 0.1 : span <= 100 ? 0.5 : 1;
	return { type: 'range', min: lower, max, step } as const;
}

/** The control which edits a value of the type of a property */
function control(property: PropertySpec): InputType['control'] {
	switch (property.type) {
		case 'color':
			return { type: 'color' };
		case 'number':
			return range(property);
		case 'enum':
			return { type: 'select' };
		case 'boolean':
			return { type: 'boolean' };
		case 'string':
		case 'resolvedImage':
			return { type: 'text' };
		default:
			// arrays, `formatted`, `padding`, … and every expression: a JSON editor
			return { type: 'object' };
	}
}

/** The `doc` of the specification, and its default value */
function description(property: PropertySpec) {
	const fallback =
		property.default === undefined ? '' : ` Default: \`${JSON.stringify(property.default)}\`.`;
	return `${property.doc ?? ''}${fallback}`;
}

/**
 * One control per paint and layout property of a layer type, grouped by paint and layout.
 * A property without a value is left out of the layer, so MapLibre's default applies.
 */
export function specArgTypes(type: string): Record<string, InputType> {
	return Object.fromEntries(
		properties(type).map(([category, name, property]) => [
			name,
			{
				name,
				description: description(property),
				control: control(property),
				...(property.type === 'enum' ? { options: Object.keys(property.values ?? {}) } : {}),
				table: {
					category,
					type: { summary: property.value ? `${property.type}<${property.value}>` : property.type },
					defaultValue:
						property.default === undefined
							? undefined
							: { summary: JSON.stringify(property.default) }
				}
			} satisfies InputType
		])
	);
}

/** The args of a story: its paint and layout properties, flat */
export function partsToArgs(parts: LayerParts): Record<string, unknown> {
	return { ...parts.layout, ...parts.paint };
}

/** A value which the control of its property cannot edit: an expression or legacy stops */
const isExpression = (value: unknown) =>
	Array.isArray(value) || (typeof value === 'object' && value !== null);

/**
 * The controls of a story which differ from those of its type: a JSON editor for each property
 * whose value is an expression, since a color picker or a slider cannot hold one
 */
export function storyArgTypes(parts: LayerParts): Record<string, InputType> {
	return Object.fromEntries(
		Object.entries(partsToArgs(parts))
			.filter(([, value]) => isExpression(value))
			.map(([name]) => [name, { control: { type: 'object' } }])
	);
}

/** The paint and layout of a layer of the type, from the args which have a value */
export function argsToParts(type: string, args: Record<string, unknown>): LayerParts {
	const parts: Required<LayerParts> = { paint: {}, layout: {} };
	for (const [category, name] of properties(type)) {
		const value = args[name];
		if (value === undefined || value === null || value === '') continue;
		parts[category][name] = value;
	}
	return {
		...(Object.keys(parts.paint).length ? { paint: parts.paint } : {}),
		...(Object.keys(parts.layout).length ? { layout: parts.layout } : {})
	};
}
