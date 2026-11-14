import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext } from '../test-utils';
import { boxHeight, renderFillExtrusion } from './fill-extrusion';

describe('renderFillExtrusion', () => {
	it('draws three faces, the sides darker than the top', () => {
		const layer = evaluatedLayer('fill-extrusion', { 'fill-extrusion-color': '#ffffff' });
		const symbol = renderFillExtrusion(layer, renderContext([layer]));
		const faces = symbol.svg.querySelectorAll('polygon');
		expect(faces).toHaveLength(3);
		expect([...faces].map((f) => f.getAttribute('fill'))).toEqual([
			'#cccccc',
			'#999999',
			'#ffffff'
		]);
	});

	it('puts the opacity on the group so that faces do not show through', () => {
		const layer = evaluatedLayer('fill-extrusion', {
			'fill-extrusion-color': 'rgba(255,0,0,0.5)',
			'fill-extrusion-opacity': 0.5
		});
		const symbol = renderFillExtrusion(layer, renderContext([layer]));
		expect(attrsOf(symbol.svg, 'g').opacity).toBe('0.25');
	});

	it('spreads the heights of the classes relative to the tallest', () => {
		const [low, high] = [10, 40].map((h) =>
			evaluatedLayer('fill-extrusion', { 'fill-extrusion-height': h })
		);
		expect(boxHeight(high, [low, high])).toBe(20);
		expect(boxHeight(low, [low, high])).toBeCloseTo(3 + 17 / 4);
		expect(boxHeight(low, [low])).toBe(10);
		expect(boxHeight(low, [low, low])).toBe(10);
	});
});
