import type { LayerSpecification } from 'maplibre-gl';
import type { StyleEditorMap } from '../lib/interfaces';

/** a map with only the layers of a style, for the stories of the controls (no rendering) */
export interface MockMap extends StyleEditorMap {
	/** called after a property is set */
	onset?: (layerId: string, property: string, value: unknown) => void;
}

/** a deep copy; the args of the stories are proxies, which `structuredClone` does not copy */
const clone = <T>(value: T): T =>
	value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

/**
 * Create a map holding layers in memory, with the methods the style editor uses.
 *
 * @param layers the layers
 * @param sdfImages the names of the images which are SDF images; other images are not SDF
 * @returns the map
 */
export function createMockMap(layers: LayerSpecification[], sdfImages: string[] = []): MockMap {
	const style = { version: 8, sources: {}, layers: clone(layers) };
	const find = (id: string) => style.layers.find((l) => l.id === id);
	const set = (group: 'paint' | 'layout') => (id: string, property: string, value: unknown) => {
		const layer = find(id) as Record<string, Record<string, unknown> | undefined> | undefined;
		if (!layer) return;
		const properties = (layer[group] ??= {});
		if (value === undefined) delete properties[property];
		else properties[property] = clone(value);
		map.onset?.(id, property, value);
		return map;
	};
	const get = (group: 'paint' | 'layout') => (id: string, property: string) =>
		(find(id) as Record<string, Record<string, unknown> | undefined> | undefined)?.[group]?.[
			property
		];

	const map = {
		getStyle: () => clone(style),
		getLayer: (id: string) => find(id),
		getPaintProperty: get('paint'),
		setPaintProperty: set('paint'),
		getLayoutProperty: get('layout'),
		setLayoutProperty: set('layout'),
		addLayer: (layer: LayerSpecification, before?: string) => {
			const index = before ? style.layers.findIndex((l) => l.id === before) : -1;
			if (index < 0) style.layers.push(layer);
			else style.layers.splice(index, 0, layer);
			return map;
		},
		removeLayer: (id: string) => {
			style.layers = style.layers.filter((l) => l.id !== id);
			return map;
		},
		getImage: (name: string) => ({ sdf: sdfImages.includes(name) })
	} as unknown as MockMap;
	return map;
}
