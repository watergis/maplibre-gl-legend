import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import {
	diffProperties,
	parseProperties,
	stringifyLayer,
	stringifyProperties
} from './manual-format';

describe('manual format', () => {
	const paint = {
		'line-color': '#ff0000',
		'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1]
	};

	it('round-trips YAML and JSON', () => {
		for (const format of ['yaml', 'json'] as const) {
			expect(parseProperties(stringifyProperties(paint, format), format)).toEqual(paint);
		}
	});

	it('reads empty text as no property', () => {
		expect(stringifyProperties({}, 'yaml')).toBe('');
		expect(parseProperties('  ', 'json')).toEqual({});
	});

	it('rejects invalid text', () => {
		expect(() => parseProperties('{', 'json')).toThrow();
		expect(() => parseProperties('- a\n- b', 'yaml')).toThrow();
	});

	it('lists the changed and removed properties', () => {
		expect(
			diffProperties(paint, { 'line-color': '#00ff00', 'line-width': paint['line-width'] })
		).toEqual([['line-color', '#00ff00']]);
		expect(diffProperties(paint, { 'line-color': '#ff0000', 'line-blur': 1 })).toEqual([
			['line-width', undefined],
			['line-blur', 1]
		]);
	});

	it('writes a whole layer as YAML and JSON', () => {
		const layer: LayerSpecification = {
			id: 'roads',
			type: 'line',
			source: 'roads',
			filter: ['==', ['get', 'class'], 'primary'],
			paint: { 'line-color': '#ff0000', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1] }
		};
		expect(stringifyLayer(undefined, 'yaml')).toBe('');
		expect(JSON.parse(stringifyLayer(layer, 'json'))).toEqual(layer);
		expect(parseProperties(stringifyLayer(layer, 'yaml'), 'yaml')).toEqual(layer);
	});
});
