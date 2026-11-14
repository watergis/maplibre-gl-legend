import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext } from '../test-utils';
import { renderFill } from './fill';

const render = (paint: Record<string, unknown>) =>
	renderFill(evaluatedLayer('fill', paint), renderContext());

describe('renderFill', () => {
	it('draws a rectangle with a 1px outline inset by half a pixel', () => {
		const symbol = render({ 'fill-color': '#ff0000' });
		expect([symbol.width, symbol.height]).toEqual([30, 20]);
		expect(symbol.svg.children).toHaveLength(1);
		expect(attrsOf(symbol.svg, 'rect')).toMatchObject({
			x: '0.5',
			y: '0.5',
			width: '29',
			height: '19',
			fill: '#ff0000',
			'fill-opacity': '1',
			// fill-antialias is on by default: the outline is the fill color
			stroke: '#ff0000',
			'stroke-width': '1'
		});
	});

	it('uses fill-outline-color for the outline, with the fill opacity', () => {
		const rect = attrsOf(
			render({ 'fill-color': '#ff0000', 'fill-outline-color': '#0000ff', 'fill-opacity': 0.5 }).svg,
			'rect'
		);
		expect(rect).toMatchObject({
			stroke: '#0000ff',
			'stroke-opacity': '0.5',
			'fill-opacity': '0.5'
		});
	});

	it('draws no outline when fill-antialias is off', () => {
		const rect = attrsOf(
			render({ 'fill-outline-color': '#0000ff', 'fill-antialias': false }).svg,
			'rect'
		);
		expect(rect.stroke).toBeUndefined();
	});

	it('clamps and composes the opacities', () => {
		const rect = attrsOf(
			render({ 'fill-color': 'rgba(0,0,0,0.5)', 'fill-opacity': 7 }).svg,
			'rect'
		);
		expect(rect['fill-opacity']).toBe('0.5');
		const faint = attrsOf(
			render({ 'fill-color': 'rgba(0,0,0,0.5)', 'fill-opacity': 0.5 }).svg,
			'rect'
		);
		expect(faint['fill-opacity']).toBe('0.25');
		expect(attrsOf(render({ 'fill-opacity': -1 }).svg, 'rect')['fill-opacity']).toBe('0');
	});
});
