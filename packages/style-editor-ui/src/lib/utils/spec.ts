import { latest } from '@maplibre/maplibre-gl-style-spec';
import type { LayerType, PropertyType } from '../interfaces';

/** the part of the style specification of a property which the editor uses */
export interface PropertySpec {
	type: string;
	default?: unknown;
	minimum?: number;
	maximum?: number;
	values?: Record<string, unknown> | string[];
}

const SPEC_URL = 'https://maplibre.org/maplibre-style-spec/layers/';

/**
 * The style specification of a property.
 *
 * @param layerType the type of the layer
 * @param type `paint` or `layout`
 * @param property the name of the property
 * @returns the specification, or `undefined` when the property does not exist
 */
export function getPropertySpec(
	layerType: LayerType,
	type: PropertyType,
	property: string
): PropertySpec | undefined {
	const group = (latest as unknown as Record<string, Record<string, PropertySpec>>)[
		`${type}_${layerType}`
	];
	return group?.[property];
}

/**
 * The URL of the documentation of a layer type, or of one of its properties.
 *
 * @param layerType the type of the layer
 * @param type `paint` or `layout`, with `property`
 * @param property the name of the property
 * @returns the URL in the MapLibre Style Specification
 */
export function getHelpUrl(layerType: LayerType, type?: PropertyType, property?: string): string {
	if (type && property) return `${SPEC_URL}#${type}-${layerType}-${property}`;
	return `${SPEC_URL}#${layerType}`;
}
