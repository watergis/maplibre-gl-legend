import { describe, expect, it } from 'vitest';
import { labelClasses } from '../label';
import { classSummary, testLayer } from '../test-utils';
import { classifyLayer } from './index';

const labels = (type: string, paint: Record<string, unknown>, zoom = 0) => {
	const layer = testLayer(type, paint);
	return labelClasses(layer, classifyLayer(layer, { zoom })).map((c) => c.text);
};

describe('classifyLayer: axes', () => {
	it('skips a first axis which does not classify, or does not parse', () => {
		const opacity = ['match', ['get', 'k'], 'a', 0.5, 1];
		expect(labels('fill', { 'fill-color': '#f00', 'fill-opacity': opacity })).toEqual([
			'a',
			'Other'
		]);
		expect(
			labels('fill', { 'fill-color': ['match', ['get', 'x']], 'fill-opacity': opacity })
		).toEqual(['a', 'Other']);
	});

	it('classifies by the first axis when two properties use different fields', () => {
		const layer = testLayer('fill', {
			'fill-color': ['match', ['get', 'kind'], 'park', '#0f0', '#888'],
			'fill-opacity': ['step', ['get', 'n'], 0.2, 10, 0.8]
		});
		// the features have no `n`, so the step fails as it would on the map: the default, 1
		expect(classSummary(layer, 0, 'fill-opacity')).toEqual([
			{ kind: 'category', properties: { kind: 'park' }, value: 1 },
			{ kind: 'default', properties: {}, value: 1 }
		]);
	});
});

describe('classifyLayer: more node shapes', () => {
	it('substitutes the branches of a geometry-type match', () => {
		const layer = testLayer('line', {
			'line-width': ['match', ['geometry-type'], 'LineString', 3, 1]
		});
		expect(classSummary(layer, 0, 'line-width')).toEqual([
			{ kind: 'category', properties: {}, value: 3 },
			{ kind: 'default', properties: {}, value: 1 }
		]);
	});

	it('handles a step with one threshold and negative thresholds', () => {
		expect(labels('fill', { 'fill-opacity': ['step', ['get', 'n'], 0.2, 10, 0.8] })).toEqual([
			'< 10',
			'≥ 10'
		]);
		const negative = testLayer('fill', {
			'fill-opacity': ['step', ['get', 't'], 0.1, -20, 0.5, -5, 0.9]
		});
		expect(classifyLayer(negative, { zoom: 0 }).map((c) => c.properties.t)).toEqual([
			-27.5, -12.5, 2.5
		]);
		expect(classSummary(negative, 0, 'fill-opacity').map((c) => c.value)).toEqual([0.1, 0.5, 0.9]);
	});

	it('handles an exponential interpolate, labelled with its bounds', () => {
		const paint = {
			'circle-radius': ['interpolate', ['exponential', 2], ['get', 'n'], 0, 1, 5, 2, 10, 33]
		};
		expect(labels('circle', paint)).toEqual(['≤ 0', '5', '≥ 10']);
		expect(
			classSummary(testLayer('circle', paint), 0, 'circle-radius').map((c) => c.value)
		).toEqual([1, 2, 33]);
		expect(
			labels('circle', { 'circle-radius': ['interpolate', ['linear'], ['get', 'n'], 4, 1] })
		).toEqual(['4']);
	});
});

describe('classifyLayer: legacy functions', () => {
	it('gives a single class for an identity function', () => {
		const layer = testLayer('circle', {
			'circle-radius': { property: 'r', type: 'identity', default: 3 }
		});
		expect(classSummary(layer, 0, 'circle-radius')).toEqual([
			{ kind: 'single', properties: {}, value: 3 }
		]);
	});

	it('classifies a categorical function on numbers', () => {
		const layer = testLayer('circle', {
			'circle-color': {
				property: 'level',
				type: 'categorical',
				stops: [
					[1, '#f00'],
					[2, '#0f0']
				],
				default: '#00f'
			}
		});
		expect(classSummary(layer, 0, 'circle-color')).toEqual([
			{ kind: 'category', properties: { level: 1 }, value: 'rgba(255,0,0,1)' },
			{ kind: 'category', properties: { level: 2 }, value: 'rgba(0,255,0,1)' },
			{ kind: 'default', properties: {}, value: 'rgba(0,0,255,1)' }
		]);
	});

	it('classifies a zoom-and-property function at the zoom', () => {
		const layer = testLayer('circle', {
			'circle-radius': {
				property: 'n',
				stops: [
					[{ zoom: 0, value: 0 }, 1],
					[{ zoom: 0, value: 10 }, 5],
					[{ zoom: 20, value: 0 }, 2],
					[{ zoom: 20, value: 10 }, 10]
				]
			}
		});
		expect(classSummary(layer, 10, 'circle-radius')).toEqual([
			{ kind: 'stop', properties: { n: 0 }, value: 1.5 },
			{ kind: 'stop', properties: { n: 10 }, value: 7.5 }
		]);
	});
});
