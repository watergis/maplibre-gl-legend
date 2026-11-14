import { describe, expect, it } from 'vitest';
import { labelClasses } from '../label';
import { classifyLayer } from './index';
import { testLayer } from '../test-utils';

const k = ['get', 'k'];
const labels = (paint: Record<string, unknown>, zoom: number) => {
	const layer = testLayer('fill', paint);
	return labelClasses(layer, classifyLayer(layer, { zoom })).map((c) => c.text);
};

describe('classifyLayer: classes active at the zoom', () => {
	const interpolate = {
		'fill-color': [
			'interpolate',
			['linear'],
			['zoom'],
			5,
			['match', k, 'a', '#f00', '#888'],
			15,
			['match', k, 'a', '#f00', 'b', '#00f', '#888']
		]
	};

	it('joins the classes of the two stops around the zoom', () => {
		expect(labels(interpolate, 12)).toEqual(['a', 'b', 'Other']);
		expect(labels(interpolate, 3)).toEqual(['a', 'Other']);
	});

	it('evaluates a class of the second stop only for its own feature', () => {
		const layer = testLayer('fill', interpolate);
		const b = classifyLayer(layer, { zoom: 15 })[1];
		expect(b.properties).toEqual({ k: 'b' });
		expect(b.layer.paint['fill-color']).toBe('rgba(0,0,255,1)');
	});

	it('takes the active branch of a zoom step', () => {
		const step = {
			'fill-color': [
				'step',
				['zoom'],
				['match', k, 'a', '#f00', '#888'],
				10,
				['match', k, 'x', '#f00', 'y', '#0f0', '#888']
			]
		};
		expect(labels(step, 12)).toEqual(['x', 'y', 'Other']);
		expect(labels(step, 8)).toEqual(['a', 'Other']);
	});

	it('handles legacy zoom-and-property functions the same way', () => {
		const legacy = {
			'fill-opacity': {
				property: 'n',
				type: 'interval',
				stops: [
					[{ zoom: 0, value: 0 }, 0.2],
					[{ zoom: 0, value: 10 }, 0.4],
					[{ zoom: 10, value: 0 }, 0.6],
					[{ zoom: 10, value: 50 }, 0.8]
				]
			}
		};
		expect(labels(legacy, 5)).toEqual(['< 10', '≥ 10', '< 50', '≥ 50']);
		expect(labels(legacy, 12)).toEqual(['< 50', '≥ 50']);
	});
});
