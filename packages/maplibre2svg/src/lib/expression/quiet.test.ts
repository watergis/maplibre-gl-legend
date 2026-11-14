import type { LayerSpecification } from 'maplibre-gl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyLayer } from '../classify';

describe('evaluation is silent', () => {
	afterEach(() => vi.restoreAllMocks());

	it('does not log when values are missing or fail to evaluate', () => {
		const warn = vi.spyOn(console, 'warn');
		const error = vi.spyOn(console, 'error');
		const layers = [
			{ 'circle-color': { property: 'c', type: 'identity' } },
			{ 'circle-color': ['get', 'c'], 'circle-radius': ['get', 'r'] },
			{ 'circle-color': ['to-color', ['get', 'c']] },
			{ 'circle-radius': ['case', ['<', ['get', 'n'], 5], 2, ['length', ['get', 's']]] },
			{ 'circle-color': ['match', ['number', ['get', 'n']], 1, '#f00', '#00f'] }
		];
		for (const paint of layers) {
			const layer = {
				id: 'c',
				type: 'circle',
				source: 's',
				paint
			} as unknown as LayerSpecification;
			classifyLayer(layer, { zoom: 0 });
		}
		expect(warn).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
	});
});
