import type { LayerSpecification } from 'maplibre-gl';
import { classifyLayer } from './classify';
import { evaluateLayer, type EvaluatedLayer } from './expression';
import type { RenderContext } from './layers';

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

/** A layer evaluated at zoom 0 for a feature */
export const evaluatedLayer = (
	type: string,
	paint: Record<string, unknown> = {},
	layout: Record<string, unknown> = {},
	properties: Record<string, unknown> = {}
) => evaluateLayer(testLayer(type, paint, layout), { zoom: 0, properties });

/** A render context with the default swatch */
export const renderContext = (siblings: EvaluatedLayer[] = []): RenderContext => ({
	document,
	swatch: { width: 30, height: 20, maxSize: 40 },
	siblings
});

/** The attributes of the first element of the name in a symbol */
export function attrsOf(root: Element, selector: string, index = 0) {
	const node = root.querySelectorAll(selector)[index];
	if (!node) throw new Error(`no ${selector} #${index}`);
	return Object.fromEntries([...node.attributes].map((a) => [a.name, a.value]));
}
