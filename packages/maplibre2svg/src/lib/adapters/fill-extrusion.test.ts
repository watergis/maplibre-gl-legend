import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext, solidImage } from '../test-utils';
import { boxHeight, FillExtrusionAdapter } from './fill-extrusion';

const renderFillExtrusion = (...args: Parameters<FillExtrusionAdapter['render']>) =>
	new FillExtrusionAdapter().render(...args);

describe('renderFillExtrusion', () => {
	it('draws three faces, the sides darker than the top', async () => {
		const layer = evaluatedLayer('fill-extrusion', { 'fill-extrusion-color': '#ffffff' });
		const symbol = await renderFillExtrusion(layer, renderContext([layer]));
		const faces = symbol.svg.querySelectorAll('polygon');
		expect(faces).toHaveLength(3);
		expect([...faces].map((f) => f.getAttribute('fill'))).toEqual([
			'#cccccc',
			'#999999',
			'#ffffff'
		]);
	});

	it('puts the opacity on the group so that faces do not show through', async () => {
		const layer = evaluatedLayer('fill-extrusion', {
			'fill-extrusion-color': 'rgba(255,0,0,0.5)',
			'fill-extrusion-opacity': 0.5
		});
		const symbol = await renderFillExtrusion(layer, renderContext([layer]));
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

	it('shows fill-extrusion-pattern on the top face', async () => {
		const layer = evaluatedLayer('fill-extrusion', { 'fill-extrusion-pattern': 'p' });
		const symbol = await renderFillExtrusion(
			layer,
			renderContext([layer], { p: solidImage(4, 4) })
		);
		expect(attrsOf(symbol.svg, 'polygon', 2).fill).toMatch(/^url\(#/);
	});
});
