import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext, solidImage } from '../test-utils';
import { FRAME_COLOR } from './common';
import { renderBackground } from './background';

describe('renderBackground', () => {
	it('fills the swatch with the color and opacity, framed', async () => {
		const layer = evaluatedLayer('background', {
			'background-color': '#336699',
			'background-opacity': 0.4
		});
		const symbol = await renderBackground(layer, renderContext());
		expect(attrsOf(symbol.svg, 'rect')).toMatchObject({
			width: '30',
			height: '20',
			fill: '#336699',
			'fill-opacity': '0.4'
		});
		expect(attrsOf(symbol.svg, 'rect', 1).stroke).toBe(FRAME_COLOR);
		const bare = await renderBackground(layer, renderContext([], {}, { frame: false }));
		expect(bare.svg.querySelectorAll('rect')).toHaveLength(1);
	});

	it('fills with background-pattern', async () => {
		const layer = evaluatedLayer('background', { 'background-pattern': 'p' });
		const symbol = await renderBackground(layer, renderContext([], { p: solidImage(4, 4) }));
		expect(attrsOf(symbol.svg, 'rect').fill).toMatch(/^url\(#m2s-pattern-\d+\)$/);
	});
});
