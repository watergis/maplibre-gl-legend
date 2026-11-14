import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext } from '../test-utils';
import { renderBackground } from './background';

describe('renderBackground', () => {
	it('fills the swatch with the color and opacity', () => {
		const layer = evaluatedLayer('background', {
			'background-color': '#336699',
			'background-opacity': 0.4
		});
		const symbol = renderBackground(layer, renderContext());
		expect(symbol.svg.children).toHaveLength(1);
		expect(attrsOf(symbol.svg, 'rect')).toMatchObject({
			width: '30',
			height: '20',
			fill: '#336699',
			'fill-opacity': '0.4'
		});
	});
});
