import type { LayerSpecification } from 'maplibre-gl';
import { FIELDS, type FieldConfig } from '../lib/panels/fields';

/**
 * The field of a property in the editor of a layer type, see `FIELDS`.
 *
 * @param layerType the layer type
 * @param property the property, or `heatmap-generator`
 * @returns the field
 */
export function field<T extends FieldConfig = FieldConfig>(
	layerType: LayerSpecification['type'],
	property: string
): T {
	const found = FIELDS[layerType]?.find((f) =>
		f.kind === 'heatmap-generator' ? property === f.kind : f.property === property
	);
	if (!found) throw new Error(`no field ${property} for ${layerType}`);
	return found as T;
}

/** the value of the property of a field in a layer */
export function valueOf(layer: LayerSpecification, f: FieldConfig): unknown {
	if (f.kind === 'heatmap-generator') return undefined;
	const group = (layer as unknown as Record<string, Record<string, unknown> | undefined>)[f.type];
	return group?.[f.property];
}
