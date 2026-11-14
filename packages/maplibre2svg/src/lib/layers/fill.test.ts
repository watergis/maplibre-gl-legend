import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext, solidImage } from '../test-utils';
import { FRAME_COLOR } from './common';
import { renderFill } from './fill';

const render = (paint: Record<string, unknown>, frame = true) =>
	renderFill(evaluatedLayer('fill', paint), renderContext([], {}, { frame }));

describe('renderFill', () => {
	it('draws a rectangle inset by half a pixel, framed instead of the same-color outline', async () => {
		const symbol = await render({ 'fill-color': '#ff0000' });
		expect([symbol.width, symbol.height]).toEqual([30, 20]);
		const rect = attrsOf(symbol.svg, 'rect');
		expect(rect).toMatchObject({ x: '0.5', y: '0.5', width: '29', height: '19', fill: '#ff0000' });
		expect(rect.stroke).toBeUndefined();
		expect(attrsOf(symbol.svg, 'rect', 1)).toMatchObject({
			fill: 'none',
			stroke: FRAME_COLOR,
			'stroke-width': '1'
		});
		expect(attrsOf(symbol.svg, 'rect', 1)['stroke-opacity']).toBeUndefined();
	});

	it('draws the outline of the fill color as MapLibre does when the frame is off', async () => {
		const symbol = await render({ 'fill-color': '#ff0000' }, false);
		expect(symbol.svg.querySelectorAll('rect')).toHaveLength(1);
		expect(attrsOf(symbol.svg, 'rect')).toMatchObject({ stroke: '#ff0000', 'stroke-width': '1' });
	});

	it('draws a distinct fill-outline-color, with the fill opacity, and no frame', async () => {
		const symbol = await render({
			'fill-color': '#ff0000',
			'fill-outline-color': '#0000ff',
			'fill-opacity': 0.5
		});
		expect(symbol.svg.querySelectorAll('rect')).toHaveLength(1);
		expect(attrsOf(symbol.svg, 'rect')).toMatchObject({
			stroke: '#0000ff',
			'stroke-opacity': '0.5',
			'fill-opacity': '0.5'
		});
	});

	it('frames a fill-outline-color which equals the fill', async () => {
		const symbol = await render({ 'fill-color': '#ff0000', 'fill-outline-color': '#f00' });
		expect(attrsOf(symbol.svg, 'rect').stroke).toBeUndefined();
		expect(attrsOf(symbol.svg, 'rect', 1).stroke).toBe(FRAME_COLOR);
	});

	it('draws no outline when fill-antialias is off, but the frame', async () => {
		const symbol = await render({ 'fill-outline-color': '#0000ff', 'fill-antialias': false });
		expect(attrsOf(symbol.svg, 'rect').stroke).toBeUndefined();
		expect(attrsOf(symbol.svg, 'rect', 1).stroke).toBe(FRAME_COLOR);
		const bare = await render({ 'fill-antialias': false }, false);
		expect(bare.svg.querySelectorAll('rect')).toHaveLength(1);
		expect(attrsOf(bare.svg, 'rect').stroke).toBeUndefined();
	});

	it('clamps and composes the opacities; the frame keeps its own', async () => {
		const rect = async (paint: Record<string, unknown>) =>
			attrsOf((await render(paint)).svg, 'rect');
		expect(
			(await rect({ 'fill-color': 'rgba(0,0,0,0.5)', 'fill-opacity': 7 }))['fill-opacity']
		).toBe('0.5');
		expect(
			(await rect({ 'fill-color': 'rgba(0,0,0,0.5)', 'fill-opacity': 0.5 }))['fill-opacity']
		).toBe('0.25');
		expect((await rect({ 'fill-opacity': -1 }))['fill-opacity']).toBe('0');
		const faint = await render({ 'fill-opacity': 0.1 });
		expect(attrsOf(faint.svg, 'rect', 1).stroke).toBe(FRAME_COLOR);
	});

	it('fills with fill-pattern when the image is there, else with the color', async () => {
		const layer = evaluatedLayer('fill', { 'fill-color': '#00ff00', 'fill-pattern': 'dots' });
		const symbol = await renderFill(
			layer,
			renderContext([], { dots: solidImage(8, 4, undefined, { pixelRatio: 2 }) })
		);
		const pattern = attrsOf(symbol.svg, 'pattern');
		expect(pattern).toMatchObject({ width: '4', height: '2', patternUnits: 'userSpaceOnUse' });
		expect(attrsOf(symbol.svg, 'rect').fill).toBe(`url(#${pattern.id})`);
		const missing = await renderFill(layer, renderContext());
		expect(attrsOf(missing.svg, 'rect').fill).toBe('#00ff00');
	});
});
