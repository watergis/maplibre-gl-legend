import type { LayerSpecification } from 'maplibre-gl';
import { classifyLayer } from './classify';

/** A layer for tests */
export const testLayer = (
	type: string,
	paint: Record<string, unknown>,
	layout: Record<string, unknown> = {}
) => ({ id: 'test', type, source: 's', paint, layout }) as unknown as LayerSpecification;

/** The classes of a layer, with the value of one property each */
export const classSummary = (layer: LayerSpecification, zoom: number, property: string) =>
	classifyLayer(layer, { zoom }).map((c) => ({
		kind: c.kind,
		properties: c.properties,
		value: c.layer.paint[property] ?? c.layer.layout[property]
	}));
