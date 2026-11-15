import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext } from '../../test-utils';
import { CircleAdapter } from './index';

const renderCircle = (...args: Parameters<CircleAdapter['render']>) =>
	new CircleAdapter().render(...args);

const render = async (paint: Record<string, unknown>) =>
	renderCircle(evaluatedLayer('circle', paint), renderContext());

describe('renderCircle', () => {
	it('draws a circle of the real radius in the middle of the swatch', async () => {
		const symbol = await render({ 'circle-radius': 4, 'circle-color': '#ff0000' });
		expect([symbol.width, symbol.height]).toEqual([30, 20]);
		expect(symbol.svg.children).toHaveLength(1);
		expect(attrsOf(symbol.svg, 'circle')).toMatchObject({
			cx: '15',
			cy: '10',
			r: '4',
			fill: '#ff0000'
		});
	});

	it('draws the stroke outside the radius', async () => {
		const symbol = await render({
			'circle-radius': 4,
			'circle-stroke-width': 2,
			'circle-stroke-color': '#000'
		});
		expect(attrsOf(symbol.svg, 'circle', 1)).toMatchObject({
			r: '5',
			'stroke-width': '2',
			fill: 'none',
			stroke: '#000000'
		});
	});

	it('grows the swatch with the radius and clamps it to maxSize', async () => {
		const mid = await render({ 'circle-radius': 14 });
		expect([mid.width, mid.height]).toEqual([30, 30]);
		const big = await render({ 'circle-radius': 100, 'circle-stroke-width': 100 });
		expect(big.height).toBe(42);
		expect(attrsOf(big.svg, 'circle')).toMatchObject({ r: '10' });
		expect(attrsOf(big.svg, 'circle', 1)).toMatchObject({ r: '15', 'stroke-width': '10' });
	});

	it('composes the fill and stroke opacities separately', async () => {
		const symbol = await render({
			'circle-opacity': 0.5,
			'circle-stroke-width': 1,
			'circle-stroke-opacity': 0.25
		});
		expect(attrsOf(symbol.svg, 'circle')['fill-opacity']).toBe('0.5');
		expect(attrsOf(symbol.svg, 'circle', 1)['stroke-opacity']).toBe('0.25');
	});
});
