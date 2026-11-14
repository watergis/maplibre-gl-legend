import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { createLayerLegend } from '../legend';
import { attrsOf } from '../test-utils';

const relief = (color: unknown, extra: Record<string, unknown> = {}) => {
	const layer = {
		id: 'relief',
		type: 'color-relief',
		source: 'dem',
		paint: { 'color-relief-color': color, 'color-relief-opacity': 0.5 },
		...extra
	} as unknown as LayerSpecification;
	return createLayerLegend(layer, {
		version: 8,
		sources: {},
		layers: [layer]
	} as StyleSpecification);
};
const rows = async (color: unknown, extra?: Record<string, unknown>) =>
	(await relief(color, extra)).entries.map((e) => [e.kind, e.label, attrsOf(e.svg, 'rect').fill]);

describe('color-relief', () => {
	it('gives one row per stop of an interpolate, low to high, with bounds', async () => {
		expect(
			await rows([
				'interpolate',
				['linear'],
				['elevation'],
				-100,
				'#0000ff',
				500,
				'#00ff00',
				3000,
				'#ffffff'
			])
		).toEqual([
			['stop', '≤ -100', '#0000ff'],
			['stop', '500', '#00ff00'],
			['stop', '≥ 3000', '#ffffff']
		]);
	});

	it('gives one row per interval of a step, the outer ones included', async () => {
		expect(await rows(['step', ['elevation'], '#0000ff', 0, '#00ff00', 1000, '#ff0000'])).toEqual([
			['range', '< 0', '#0000ff'],
			['range', '0 – 1000', '#00ff00'],
			['range', '≥ 1000', '#ff0000']
		]);
	});

	it('draws area swatches with the opacity and the frame', async () => {
		const legend = await relief(['step', ['elevation'], '#0000ff', 0, '#00ff00']);
		const svg = legend.entries[0].svg;
		expect(attrsOf(svg, 'rect')).toMatchObject({ 'fill-opacity': '0.5', width: '29' });
		expect(attrsOf(svg, 'rect', 1).fill).toBe('none');
		expect(legend.entries[0].ramp).toBeUndefined();
	});

	it('applies metadata.legend', async () => {
		const legend = await relief(['step', ['elevation'], '#0000ff', 0, '#00ff00'], {
			metadata: { legend: { label: 'Elevation', 'custom-labels': ['Sea', 'Land'] } }
		});
		expect([legend.label, ...legend.entries.map((e) => e.label)]).toEqual([
			'Elevation',
			'Sea',
			'Land'
		]);
	});

	it('falls back to one neutral entry without readable stops', async () => {
		for (const color of [
			undefined,
			'#ff0000',
			['interpolate', ['linear'], ['zoom'], 0, '#000', 10, '#fff']
		]) {
			const legend = await relief(color);
			expect(legend.entries.map((e) => e.kind)).toEqual(['single']);
			expect(attrsOf(legend.entries[0].svg, 'rect').fill).toBe('#cccccc');
		}
	});

	it('keeps huge elevations out of the markup as Infinity', async () => {
		const legend = await relief(['step', ['elevation'], '#000', -1e308, '#0f0', 1e308, '#fff']);
		const text = legend.entries.map((e) => `${e.label} ${e.svg.outerHTML}`).join(' ');
		expect(text).not.toMatch(/Infinity|NaN/);
	});
});
