import yaml from 'js-yaml';
import type { LayerSpecification } from 'maplibre-gl';

/** the text format of the manual editor */
export type ManualFormat = 'yaml' | 'json';

/** a `paint` or `layout` object of a layer */
export type Properties = Record<string, unknown>;

/**
 * Write properties as text.
 *
 * @param properties the properties
 * @param format YAML or JSON
 * @returns the text; an empty string for no property
 */
export function stringifyProperties(
	properties: Properties | undefined,
	format: ManualFormat
): string {
	if (!properties || Object.keys(properties).length === 0) return '';
	return format === 'yaml'
		? yaml.dump(properties, { lineWidth: -1, flowLevel: 2 })
		: JSON.stringify(properties, null, 2);
}

/**
 * Write a whole layer as text.
 *
 * @param layer the layer
 * @param format YAML or JSON
 * @returns the text; an empty string for no layer
 */
export function stringifyLayer(
	layer: LayerSpecification | undefined,
	format: ManualFormat
): string {
	if (!layer) return '';
	return format === 'yaml'
		? yaml.dump(layer, { lineWidth: -1, flowLevel: 3 })
		: JSON.stringify(layer, null, 2);
}

/**
 * Read properties from text.
 *
 * @param text the text
 * @param format YAML or JSON
 * @returns the properties; an empty object for an empty text
 * @throws Error when the text is not valid, or not an object
 */
export function parseProperties(text: string, format: ManualFormat): Properties {
	if (text.trim() === '') return {};
	const value = format === 'yaml' ? yaml.load(text) : JSON.parse(text);
	if (value === null || value === undefined) return {};
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Properties must be an object of property names and values');
	}
	return value as Properties;
}

/**
 * The changes to make on the map so that the properties become `next`: the changed properties,
 * and `undefined` for the removed ones (to reset them to their defaults).
 *
 * @param current the current properties
 * @param next the new properties
 * @returns `[property, value]` pairs
 */
export function diffProperties(
	current: Properties | undefined,
	next: Properties | undefined
): [string, unknown][] {
	const changes: [string, unknown][] = [];
	const before = current ?? {};
	const after = next ?? {};
	for (const key of Object.keys(before)) {
		if (!(key in after)) changes.push([key, undefined]);
	}
	for (const [key, value] of Object.entries(after)) {
		if (JSON.stringify(before[key]) !== JSON.stringify(value)) changes.push([key, value]);
	}
	return changes;
}
