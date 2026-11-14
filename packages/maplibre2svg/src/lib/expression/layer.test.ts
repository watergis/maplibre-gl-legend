import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { evaluateLayer, evaluateProperty } from './layer';

const fill = (paint: Record<string, unknown>, layout: Record<string, unknown> = {}) =>
	({ id: 'f', type: 'fill', source: 's', paint, layout }) as unknown as LayerSpecification;

describe('evaluateLayer', () => {
	it('falls back to the defaults of the specification for unset properties', () => {
		const layer = evaluateLayer(fill({}), { zoom: 0 });
		expect(layer.paint['fill-opacity']).toBe(1);
		expect(layer.paint['fill-color']).toBe('rgba(0,0,0,1)');
		expect(layer.paint['fill-antialias']).toBe(true);
		expect(layer.layout.visibility).toBe('visible');
		expect(layer.paint).not.toHaveProperty('fill-pattern');
	});

	it('evaluates constants, colors and expressions to plain values', () => {
		const layer = evaluateLayer(fill({ 'fill-color': '#ff0000', 'fill-opacity': ['get', 'o'] }), {
			zoom: 0,
			properties: { o: 0.5 }
		});
		expect(layer.paint['fill-color']).toBe('rgba(255,0,0,1)');
		expect(layer.paint['fill-opacity']).toBe(0.5);
		expect(layer.properties).toEqual({ o: 0.5 });
	});

	it('follows the zoom for zoom expressions and legacy zoom functions', () => {
		const line = {
			id: 'l',
			type: 'line',
			source: 's',
			paint: {
				'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 20, 11],
				'line-opacity': {
					stops: [
						[10, 0],
						[20, 1]
					]
				}
			}
		} as unknown as LayerSpecification;
		expect(evaluateLayer(line, { zoom: 15 }).paint['line-width']).toBe(6);
		expect(evaluateLayer(line, { zoom: 15 }).paint['line-opacity']).toBe(0.5);
		expect(evaluateLayer(line, { zoom: 20 }).paint['line-width']).toBe(11);
	});

	it('does not throw when one property is broken, and keeps the others', () => {
		const layer = fill({
			'fill-color': ['no-such-operator', 1],
			'fill-opacity': ['get'],
			'fill-outline-color': '#00ff00'
		});
		const evaluated = evaluateLayer(layer, { zoom: 0 });
		expect(evaluated.paint['fill-color']).toBe('rgba(0,0,0,1)');
		expect(evaluated.paint['fill-opacity']).toBe(1);
		expect(evaluated.paint['fill-outline-color']).toBe('rgba(0,255,0,1)');
	});

	it('turns images, arrays and formatted text into plain values', () => {
		const symbol = {
			id: 's',
			type: 'symbol',
			source: 's',
			layout: {
				'icon-image': ['get', 'icon'],
				'text-field': ['format', 'A', {}, 'b', {}],
				'icon-padding': 4
			}
		} as unknown as LayerSpecification;
		const evaluated = evaluateLayer(symbol, { zoom: 0, properties: { icon: 'pin' } });
		expect(evaluated.layout['icon-image']).toBe('pin');
		expect(evaluated.layout['text-field']).toBe('Ab');
		expect(evaluated.layout['icon-padding']).toEqual([4, 4, 4, 4]);
		expect(evaluated.layout['text-font']).toEqual([
			'Open Sans Regular',
			'Arial Unicode MS Regular'
		]);
	});

	it('leaves the color ramps out, and evaluates them on request', () => {
		const heatmap = { id: 'h', type: 'heatmap', source: 's' } as unknown as LayerSpecification;
		expect(evaluateLayer(heatmap, { zoom: 0 }).paint).not.toHaveProperty('heatmap-color');
		const color = evaluateProperty(heatmap, 'paint', 'heatmap-color', {
			zoom: 0,
			globals: { heatmapDensity: 1 }
		});
		expect(color).toBe('rgba(255,0,0,1)');
	});

	it('gives undefined for a property which the layer type does not have', () => {
		expect(evaluateProperty(fill({}), 'paint', 'line-width', { zoom: 0 })).toBeUndefined();
	});
});
