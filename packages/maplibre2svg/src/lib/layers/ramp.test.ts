import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { createLayerLegend } from '../legend';
import { evaluatedLayer } from '../test-utils';
import { curveStops, sampleRamp } from './ramp';

const legendOf = (layer: unknown) => {
	const spec = layer as LayerSpecification;
	return createLayerLegend(spec, { version: 8, sources: {}, layers: [spec] } as StyleSpecification);
};

describe('curveStops', () => {
	it('finds the stops of the curve on the input', () => {
		expect(
			curveStops(['interpolate', ['linear'], ['elevation'], 0, 'a', 500, 'b'], 'elevation')
		).toEqual([0, 500]);
		expect(curveStops(['step', ['elevation'], 'a', 100, 'b', 200, 'c'], 'elevation')).toEqual([
			100, 200
		]);
		expect(curveStops(['interpolate', ['linear'], ['zoom'], 0, 1], 'elevation')).toBeUndefined();
	});
});

describe('sampleRamp', () => {
	it('follows an interpolate across the domain', () => {
		const layer = evaluatedLayer('color-relief', {
			'color-relief-color': [
				'interpolate',
				['linear'],
				['elevation'],
				0,
				'#000000',
				1000,
				'#ffffff'
			]
		});
		const ramp = sampleRamp(layer, {
			name: 'color-relief-color',
			input: 'elevation',
			global: 'elevation'
		});
		expect([ramp?.min, ramp?.max]).toEqual([0, 1000]);
		expect(ramp?.stops[0]).toEqual({ value: 0, color: 'rgba(0,0,0,1)' });
		expect(ramp?.stops.at(-1)).toEqual({ value: 1000, color: 'rgba(255,255,255,1)' });
		expect(ramp?.stops.find((s) => s.value === 500)?.color).toBe('rgba(128,128,128,1)');
	});

	it('reproduces a step as hard stops', () => {
		const layer = evaluatedLayer('color-relief', {
			'color-relief-color': ['step', ['elevation'], '#ff0000', 0, '#00ff00', 100, '#0000ff']
		});
		const ramp = sampleRamp(layer, {
			name: 'color-relief-color',
			input: 'elevation',
			global: 'elevation'
		});
		const just = ramp?.stops.filter((s) => Math.abs(s.value - 100) < 1e-3).map((s) => s.color);
		expect(just).toEqual(['rgba(0,255,0,1)', 'rgba(0,0,255,1)']);
	});

	it('uses the default heatmap ramp, transparent at density 0', () => {
		const ramp = sampleRamp(evaluatedLayer('heatmap'), {
			name: 'heatmap-color',
			input: 'heatmap-density',
			global: 'heatmapDensity',
			domain: [0, 1]
		});
		expect(ramp?.stops[0]).toEqual({ value: 0, color: 'rgba(0,0,255,0)' });
		expect(ramp?.stops.at(-1)?.color).toBe('rgba(255,0,0,1)');
	});
});

describe('ramp entries', () => {
	it('of heatmap are labelled with the layer and take the opacity', async () => {
		const legend = await legendOf({
			id: 'heat',
			type: 'heatmap',
			source: 's',
			paint: { 'heatmap-opacity': 0.5 }
		});
		expect(legend.entries[0]).toMatchObject({ kind: 'ramp', label: 'heat' });
		expect(legend.entries[0].ramp).toMatchObject({ min: 0, max: 1 });
		expect(
			legend.entries[0].svg.querySelector('rect:last-of-type')?.getAttribute('fill-opacity')
		).toBe('0.5');
	});

	it('skip stops which are not finite or overflow the span', () => {
		const layer = evaluatedLayer('heatmap', {
			'heatmap-color': [
				'step',
				['heatmap-density'],
				'#000',
				-1e308,
				'#0f0',
				0.5,
				'#f00',
				1e308,
				'#fff'
			]
		});
		const ramp = sampleRamp(layer, {
			name: 'heatmap-color',
			input: 'heatmap-density',
			global: 'heatmapDensity',
			domain: [0, 1]
		});
		expect(JSON.stringify(ramp)).not.toMatch(/Infinity|null/);
		expect(ramp?.stops.every((s) => Number.isFinite(s.value))).toBe(true);
	});
});
