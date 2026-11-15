import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { createLayerLegend, createLegend, createLegendCache } from './index';

const style = (layers: unknown[]) =>
	({ version: 8, sources: {}, layers }) as unknown as StyleSpecification;

describe('createLayerLegend', () => {
	it('gives one entry per class with an SVG of the swatch size', async () => {
		const layer = {
			id: 'landuse',
			type: 'fill',
			source: 's',
			paint: { 'fill-color': ['match', ['get', 'kind'], 'park', '#0f0', '#00f'] }
		} as unknown as LayerSpecification;
		const legend = await createLayerLegend(layer, style([layer]), {
			swatch: { width: 24, height: 16 }
		});
		expect(legend).toMatchObject({ layerId: 'landuse', type: 'fill', label: 'landuse' });
		expect(legend.entries.map((e) => [e.kind, e.label])).toEqual([
			['category', 'park'],
			['default', 'Other']
		]);
		const [entry] = legend.entries;
		expect([entry.width, entry.height]).toEqual([24, 16]);
		expect(entry.svg.getAttribute('width')).toBe('24');
		expect(entry.svg.getAttribute('viewBox')).toBe('0 0 24 16');
	});
});

describe('createLegend', () => {
	it('gives the other layers when the expressions of one are broken', async () => {
		const legends = await createLegend(
			style([
				{ id: 'broken', type: 'line', source: 's', paint: { 'line-color': ['match'] } },
				{ id: 'bad-legacy', type: 'line', source: 's', paint: { 'line-width': { stops: 1 } } },
				{ id: 'unknown', type: 'no-such-type', source: 's' },
				{ id: 'ok', type: 'circle', source: 's', paint: { 'circle-radius': 3 } }
			]),
			{ cache: createLegendCache() }
		);
		expect(legends.map((l) => [l.layerId, l.entries.length])).toEqual([
			['broken', 1],
			['bad-legacy', 1],
			['unknown', 1],
			['ok', 1]
		]);
	});
});
