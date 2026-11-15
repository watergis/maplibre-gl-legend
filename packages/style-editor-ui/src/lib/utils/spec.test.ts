import { describe, expect, it } from 'vitest';
import { getHelpUrl, getPropertySpec } from './spec';

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
});
