import { latest } from '../style-spec';
import type { StylePropertySpecification } from 'maplibre-gl';

export type { StylePropertySpecification };

/** Whether a property is a paint or a layout property */
export type PropertyGroup = 'paint' | 'layout';

type SpecTable = Record<string, StylePropertySpecification>;

// `latest` is typed after the JSON of the reference, which has no index signature
const reference = latest as unknown as Record<string, SpecTable | undefined>;

/** The specifications of the paint or layout properties of a layer type, keyed by name */
export function propertySpecs(type: string, group: PropertyGroup): SpecTable {
	return reference[`${group}_${type}`] ?? {};
}

/** The specification of one property, or undefined if the layer type has no such property */
export function propertySpec(
	type: string,
	group: PropertyGroup,
	name: string
): StylePropertySpecification | undefined {
	const specs = propertySpecs(type, group);
	return Object.prototype.hasOwnProperty.call(specs, name) ? specs[name] : undefined;
}

/**
 * Whether the property is a color ramp, such as `heatmap-color` or `line-gradient`.
 * Those are evaluated over their own input (density, line progress, elevation) by the
 * renderer of the layer type, not for a feature.
 */
export function isColorRamp(spec: StylePropertySpecification) {
	return spec['property-type'] === 'color-ramp';
}
