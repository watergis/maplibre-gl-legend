import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import type { EvaluatedLayer } from '../expression';
import { createLayerLegend } from '../legend';
import { evaluatedLayer, renderContext } from '../test-utils';
import { crisp, opacity } from './common';
import { renderSymbol } from './index';

const legendOf = async (layer: unknown) => {
	const spec = layer as LayerSpecification;
	const style = { version: 8, sources: {}, layers: [spec] } as StyleSpecification;
	return createLayerLegend(spec, style);
};

describe('renderSymbol', () => {
	it('falls back to the neutral symbol for types without a renderer', async () => {
		const symbol = await renderSymbol(evaluatedLayer('no-such-type'), renderContext());
		expect(symbol.svg.querySelector('rect')?.getAttribute('fill')).toBe('#cccccc');
	});

	it('never writes NaN or negative sizes for hostile values', async () => {
		const hostile = (type: string, paint: Record<string, unknown>): EvaluatedLayer => ({
			...evaluatedLayer(type),
			paint: { ...evaluatedLayer(type).paint, ...paint }
		});
		const layers = [
			hostile('fill', { 'fill-opacity': Number.NaN }),
			hostile('line', {
				'line-width': 1e9,
				'line-dasharray': [1000, 1000],
				'line-gap-width': Number.NaN
			}),
			hostile('line', { 'line-width': Number.NaN, 'line-dasharray': [Number.NaN, 1e9] }),
			hostile('circle', { 'circle-radius': 1e9, 'circle-stroke-width': Number.NaN }),
			hostile('circle', { 'circle-radius': -5, 'circle-stroke-width': 1e9 }),
			hostile('fill-extrusion', {
				'fill-extrusion-height': 1e9,
				'fill-extrusion-base': Number.NaN
			}),
			hostile('background', { 'background-opacity': 1e9 })
		];
		for (const layer of layers) {
			const symbol = await renderSymbol(layer, renderContext([layer, evaluatedLayer(layer.type)]));
			const text = new XMLSerializer().serializeToString(symbol.svg);
			expect(text, layer.type).not.toMatch(/NaN|Infinity/);
			for (const node of symbol.svg.querySelectorAll('*')) {
				for (const name of ['width', 'height', 'r', 'stroke-width']) {
					const value = node.getAttribute(name);
					if (value !== null)
						expect(Number(value), `${layer.type} ${name}`).toBeGreaterThanOrEqual(0);
				}
			}
			expect(symbol.width).toBeLessThanOrEqual(80);
			expect(symbol.height).toBeLessThanOrEqual(42);
		}
	});
});

describe('common', () => {
	it('clamps and multiplies opacities', () => {
		expect(opacity(0.5, 2, undefined)).toBe(0.5);
		expect(opacity(0.5, -1)).toBe(0);
		expect(opacity(Number.NaN)).toBe(1);
	});

	it('aligns odd stroke widths on half pixels and even ones on whole pixels', () => {
		expect(crisp(10, 1)).toBe(10.5);
		expect(crisp(10.4, 2)).toBe(10);
		expect(crisp(10.2, 1.5)).toBe(10);
	});
});

describe('the symbols of a layer', () => {
	const widths = async (layer: unknown) =>
		(await legendOf(layer)).entries.map((e) => [e.width, e.svg.getAttribute('width')]);

	it('share one width for dashes', async () => {
		const legend = await legendOf({
			id: 'roads',
			type: 'line',
			source: 's',
			paint: {
				'line-dasharray': ['match', ['get', 'k'], 'a', ['literal', [4, 2]], ['literal', [1, 0]]],
				'line-width': ['match', ['get', 'k'], 'a', 3, 1]
			}
		});
		// dashes of 12 and 6 (4 and 2 times the width 3): two periods are 36px
		expect(legend.entries.map((e) => [e.width, e.svg.getAttribute('width')])).toEqual([
			[36, '36'],
			[36, '36']
		]);
		expect(legend.entries[1].svg.getAttribute('viewBox')).toBe('-3 0 36 20');
	});

	it('share one width for circles of three radii', async () => {
		const radius = ['step', ['get', 'n'], 2, 10, 10, 20, 18];
		expect(
			await widths({ id: 'c', type: 'circle', source: 's', paint: { 'circle-radius': radius } })
		).toEqual([
			[38, '38'],
			[38, '38'],
			[38, '38']
		]);
	});

	it('share one width for extrusions of three heights', async () => {
		const color = ['step', ['get', 'n'], '#f00', 10, '#0f0', 20, '#00f'];
		const result = await widths({
			id: 'b',
			type: 'fill-extrusion',
			source: 's',
			paint: { 'fill-extrusion-color': color, 'fill-extrusion-height': ['get', 'n'] }
		});
		expect(new Set(result.map(([w]) => w)).size).toBe(1);
	});
});
