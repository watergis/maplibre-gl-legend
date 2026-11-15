import { describe, expect, it } from 'vitest';
import { labelClasses } from '../label';
import { classifyLayer } from '../test-utils';
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
		expect(labels(legacy, 5)).toEqual(['< 10', '10 – 50', '≥ 50']);
		expect(labels(legacy, 12)).toEqual(['< 50', '≥ 50']);
	});

	it('joins the thresholds of steps on the same input into one partition', () => {
		const layer = testLayer('fill', {
			'fill-opacity': [
				'interpolate',
				['linear'],
				['zoom'],
				10,
				['step', ['get', 'n'], 0, 10, 1],
				20,
				['step', ['get', 'n'], 0, 50, 1]
			]
		});
		const classes = classifyLayer(layer, { zoom: 15 });
		expect(labelClasses(layer, classes).map((c) => c.text)).toEqual(['< 10', '10 – 50', '≥ 50']);
		expect(classes.map((c) => c.properties)).toEqual([{ n: -10 }, { n: 30 }, { n: 70 }]);
		// halfway between the zooms: n = 30 is above 10 but below 50
		expect(classes.map((c) => c.layer.paint['fill-opacity'])).toEqual([0, 0.5, 1]);
	});

	it('joins the stops of interpolates on the same input', () => {
		const paint = {
			'fill-opacity': [
				'interpolate',
				['linear'],
				['zoom'],
				10,
				['interpolate', ['linear'], ['get', 'n'], 0, 0, 10, 1],
				20,
				['interpolate', ['linear'], ['get', 'n'], 5, 0, 10, 1, 20, 1]
			]
		};
		expect(labels(paint, 15)).toEqual(['≤ 0', '5', '10', '≥ 20']);
	});

	it('takes the lower stop when the zoom is as far from both and they differ', () => {
		const paint = {
			'fill-color': [
				'interpolate',
				['linear'],
				['zoom'],
				10,
				['match', k, 'a', '#f00', '#888'],
				20,
				['step', ['get', 'n'], '#000', 5, '#fff']
			]
		};
		expect(labels(paint, 15)).toEqual(['a', 'Other']);
		expect(labels(paint, 15.5)).toEqual(['< 5', '≥ 5']);
	});
});
