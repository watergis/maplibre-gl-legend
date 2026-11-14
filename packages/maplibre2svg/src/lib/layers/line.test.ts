import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext } from '../test-utils';
import { renderLine } from './line';

const render = (paint: Record<string, unknown>, layout: Record<string, unknown> = {}) =>
	renderLine(evaluatedLayer('line', paint, layout), renderContext());

describe('renderLine', () => {
	it('draws a horizontal line across the swatch at the line width', () => {
		const symbol = render({ 'line-color': '#00ff00', 'line-width': 3 });
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

	it('clamps the width to the swatch height and to half a pixel', () => {
		expect(attrsOf(render({ 'line-width': 99 }).svg, 'line')['stroke-width']).toBe('20');
		expect(attrsOf(render({ 'line-width': 0 }).svg, 'line')['stroke-width']).toBe('0.5');
	});

	it('insets round caps by half the width', () => {
		const line = attrsOf(render({ 'line-width': 4 }, { 'line-cap': 'round' }).svg, 'line');
		expect([line.x1, line.x2, line['stroke-linecap']]).toEqual(['2', '28', 'round']);
	});

	it('multiplies the dashes by the width and widens the swatch for two periods', () => {
		const symbol = render({ 'line-width': 4, 'line-dasharray': [3, 2] });
		expect(attrsOf(symbol.svg, 'line')['stroke-dasharray']).toBe('12 8');
		expect(symbol.width).toBe(40);
	});

	it('draws two lines for line-gap-width', () => {
		const symbol = render({ 'line-width': 2, 'line-gap-width': 4 });
		const lines = symbol.svg.querySelectorAll('line');
		expect(lines).toHaveLength(2);
		const ys = [...lines].map((l) => Number(l.getAttribute('y1')));
		expect(ys[1] - ys[0]).toBe(6);
	});

	it('fits a wide gap into the swatch', () => {
		const lines = render({ 'line-width': 10, 'line-gap-width': 20 }).svg.querySelectorAll('line');
		const ys = [...lines].map((l) => Number(l.getAttribute('y1')));
		const width = Number(lines[0].getAttribute('stroke-width'));
		expect(ys[0] - width / 2).toBeGreaterThanOrEqual(-0.5);
		expect(ys[1] + width / 2).toBeLessThanOrEqual(20.5);
	});

	it('clamps and composes the opacity', () => {
		const line = attrsOf(
			render({ 'line-color': 'rgba(0,0,0,0.5)', 'line-opacity': 3 }).svg,
			'line'
		);
		expect(line['stroke-opacity']).toBe('0.5');
	});

	it('draws line-gradient as a linear gradient with an id unique per symbol', () => {
		const paint = {
			'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#0000ff', 1, '#ff0000']
		};
		const a = render(paint).svg;
		const b = render(paint).svg;
		const stops = a.querySelectorAll('stop');
		expect(stops).toHaveLength(11);
		expect(attrsOf(a, 'stop', 0)).toMatchObject({ offset: '0', 'stop-color': '#0000ff' });
		expect(attrsOf(a, 'stop', 10)).toMatchObject({ offset: '1', 'stop-color': '#ff0000' });
		const idA = a.querySelector('linearGradient')?.id;
		const idB = b.querySelector('linearGradient')?.id;
		expect(idA).not.toBe(idB);
		expect(attrsOf(a, 'line').stroke).toBe(`url(#${idA})`);
	});
});
