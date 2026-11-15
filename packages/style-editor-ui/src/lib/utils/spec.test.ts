import { describe, expect, it } from 'vitest';
import type { StyleSpecification } from 'maplibre-gl';
import { getHelpUrl, getPropertySpec, validateLayerProperties } from './spec';

describe('spec', () => {
	it('finds property specifications', () => {
		expect(getPropertySpec('line', 'paint', 'line-width')?.default).toBe(1);
		expect(getPropertySpec('raster', 'paint', 'raster-resampling')?.type).toBe('enum');
		expect(getPropertySpec('line', 'paint', 'no-such-property')).toBeUndefined();
	});

	it('links to the specification', () => {
		expect(getHelpUrl('fill', 'paint', 'fill-color')).toBe(
			'https://maplibre.org/maplibre-style-spec/layers/#paint-fill-fill-color'
		);
		expect(getHelpUrl('heatmap')).toBe('https://maplibre.org/maplibre-style-spec/layers/#heatmap');
	});

	it('validates the paint and layout properties of a layer', () => {
		const style: StyleSpecification = { version: 8, sources: {}, layers: [] };
		expect(
			validateLayerProperties(style, {
				id: 'roads',
				type: 'line',
				source: 'missing',
				layout: { 'line-cap': 'round' },
				paint: {
					'line-color': '#ff0000',
					'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1]
				}
			})
		).toEqual([]);
		const errors = validateLayerProperties(style, {
			id: 'roads',
			type: 'line',
			source: 'missing',
			layout: { 'line-cap': 'bad' },
			paint: { 'line-color': 'nope', 'no-such-property': 1 }
		} as never);
		expect(errors).toHaveLength(3);
		expect(errors[0]).toMatch(/^layout\.line-cap: /);
		expect(errors.some((e) => e.startsWith('paint.line-color: color expected'))).toBe(true);
		expect(errors.some((e) => e.startsWith('paint.no-such-property: unknown property'))).toBe(true);
	});
});
