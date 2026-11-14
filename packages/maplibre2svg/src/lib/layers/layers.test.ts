import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { createLayerLegend } from '../legend';
import { evaluatedLayer, renderContext } from '../test-utils';
import { crisp, opacity } from './common';
import { renderSymbol } from './index';

describe('renderSymbol', () => {
	it('falls back to the neutral symbol for types without a renderer', () => {
		const symbol = renderSymbol(evaluatedLayer('raster'), renderContext());
		expect(symbol.svg.querySelector('rect')?.getAttribute('fill')).toBe('#cccccc');
	});
});

describe('common', () => {
	it('clamps and multiplies opacities', () => {
		expect(opacity(0.5, 2, undefined)).toBe(0.5);
		expect(opacity(0.5, -1)).toBe(0);
	});

	it('aligns odd stroke widths on half pixels and even ones on whole pixels', () => {
		expect(crisp(10, 1)).toBe(10.5);
		expect(crisp(10.4, 2)).toBe(10);
		expect(crisp(10.2, 1.5)).toBe(10);
	});
});

describe('the symbols of a layer', () => {
	it('share one width', async () => {
		const layer = {
			id: 'roads',
			type: 'line',
			source: 's',
			paint: {
				'line-dasharray': ['match', ['get', 'k'], 'a', ['literal', [4, 2]], ['literal', [1, 0]]],
				'line-width': ['match', ['get', 'k'], 'a', 3, 1]
			}
		} as unknown as LayerSpecification;
		const style = { version: 8, sources: {}, layers: [layer] } as StyleSpecification;
		const legend = await createLayerLegend(layer, style);
		const widths = legend.entries.map((e) => [e.width, e.svg.getAttribute('width')]);
		// dashes of 12 and 6 (4 and 2 times the width 3): two periods are 36px
		expect(widths).toEqual([
			[36, '36'],
			[36, '36']
		]);
		expect(legend.entries[1].svg.getAttribute('viewBox')).toBe('-3 0 36 20');
	});
});
