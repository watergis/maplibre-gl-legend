import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext, solidImage } from '../test-utils';
import { lineGeometry, LineAdapter } from './line';

const renderLine = (...args: Parameters<LineAdapter['render']>) =>
	new LineAdapter().render(...args);

const render = (paint: Record<string, unknown>, layout: Record<string, unknown> = {}) =>
	renderLine(evaluatedLayer('line', paint, layout), renderContext());
const line = async (paint: Record<string, unknown>, layout: Record<string, unknown> = {}) =>
	attrsOf((await render(paint, layout)).svg, 'line');

describe('renderLine', () => {
	it('draws a horizontal line across the swatch at the line width', async () => {
		const symbol = await render({ 'line-color': '#00ff00', 'line-width': 3 });
		expect(symbol.svg.children).toHaveLength(1);
		expect(attrsOf(symbol.svg, 'line')).toMatchObject({
			x1: '0',
			x2: '30',
			y1: '10.5',
			y2: '10.5',
			stroke: '#00ff00',
			'stroke-width': '3',
			'stroke-linecap': 'butt'
		});
	});

	it('clamps the width to the swatch height and to half a pixel', async () => {
		expect((await line({ 'line-width': 99 }))['stroke-width']).toBe('20');
		expect((await line({ 'line-width': 0 }))['stroke-width']).toBe('0.5');
	});

	it('insets round caps by half the width', async () => {
		const attrs = await line({ 'line-width': 4 }, { 'line-cap': 'round' });
		expect([attrs.x1, attrs.x2, attrs['stroke-linecap']]).toEqual(['2', '28', 'round']);
	});

	it('multiplies the dashes by the width and widens the swatch for two periods', async () => {
		const symbol = await render({ 'line-width': 4, 'line-dasharray': [3, 2] });
		expect(attrsOf(symbol.svg, 'line')['stroke-dasharray']).toBe('12 8');
		expect(symbol.width).toBe(40);
		const odd = await line({ 'line-width': 2, 'line-dasharray': [1, 1, 4] });
		expect([odd['stroke-dasharray'], odd['stroke-dashoffset']]).toEqual(['10 2', '8']);
	});

	it('draws two lines for line-gap-width', async () => {
		const lines = (await render({ 'line-width': 2, 'line-gap-width': 4 })).svg.querySelectorAll(
			'line'
		);
		expect(lines).toHaveLength(2);
		const ys = [...lines].map((l) => Number(l.getAttribute('y1')));
		expect(ys[1] - ys[0]).toBe(6);
	});

	it('keeps both lines inside the swatch for any width and gap', () => {
		const pairs = [
			[1, 19],
			[1, 20],
			[1, 100],
			[50, 100],
			[5, 100],
			[0.5, 18],
			[3, 7],
			[10, 20]
		];
		for (const [width, gap] of pairs) {
			const layer = evaluatedLayer('line', { 'line-width': width, 'line-gap-width': gap });
			const geometry = lineGeometry(layer, 20);
			expect(geometry.centers).toHaveLength(2);
			for (const y of geometry.centers) {
				expect(y - geometry.width / 2, `${width}/${gap}`).toBeGreaterThanOrEqual(-1e-9);
				expect(y + geometry.width / 2, `${width}/${gap}`).toBeLessThanOrEqual(20 + 1e-9);
			}
			expect(geometry.centers[1]).toBeGreaterThan(geometry.centers[0]);
		}
	});

	it('clamps and composes the opacity', async () => {
		expect(
			(await line({ 'line-color': 'rgba(0,0,0,0.5)', 'line-opacity': 3 }))['stroke-opacity']
		).toBe('0.5');
	});

	it('draws line-gradient as a linear gradient with an id unique per symbol', async () => {
		const paint = {
			'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#0000ff', 1, '#ff0000']
		};
		const a = (await render(paint)).svg;
		const b = (await render(paint)).svg;
		expect(a.querySelectorAll('stop')).toHaveLength(11);
		expect(attrsOf(a, 'stop', 0)).toMatchObject({ offset: '0', 'stop-color': '#0000ff' });
		expect(attrsOf(a, 'stop', 10)).toMatchObject({ offset: '1', 'stop-color': '#ff0000' });
		const idA = a.querySelector('linearGradient')?.id;
		expect(idA).not.toBe(b.querySelector('linearGradient')?.id);
		expect(attrsOf(a, 'line').stroke).toBe(`url(#${idA})`);
	});

	it('draws line-pattern scaled to the line width', async () => {
		const layer = evaluatedLayer('line', { 'line-width': 4, 'line-pattern': 'arrow' });
		const symbol = await renderLine(layer, renderContext([], { arrow: solidImage(16, 8) }));
		expect(attrsOf(symbol.svg, 'pattern')).toMatchObject({ width: '8', height: '4', y: '8' });
		expect(attrsOf(symbol.svg, 'rect')).toMatchObject({ y: '8', height: '4', width: '30' });
		expect(symbol.svg.querySelector('line')).toBeNull();
	});
});
