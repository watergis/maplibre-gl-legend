import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { classifyLayer, classSummary, testLayer } from '../test-utils';
import { labelClasses } from '../label';
import { seedFromFilter } from './filter-seed';

const layer = (
	type: string,
	paint: Record<string, unknown>,
	layout: Record<string, unknown> = {}
) => ({ id: 'test', type, source: 's', paint, layout }) as unknown as LayerSpecification;

const summary = (l: LayerSpecification, zoom = 0, property = 'fill-color') =>
	classifyLayer(l, { zoom }).map((c) => ({
		kind: c.kind,
		properties: c.properties,
		value: c.layer.paint[property] ?? c.layer.layout[property]
	}));

describe('classifyLayer: match', () => {
	it('gives one class per branch, arrays together, and the default', () => {
		const fill = layer('fill', {
			'fill-color': [
				'match',
				['get', 'kind'],
				'park',
				'#00ff00',
				['shop', 'mall'],
				'#ff0000',
				'#0000ff'
			]
		});
		expect(summary(fill)).toEqual([
			{ kind: 'category', properties: { kind: 'park' }, value: 'rgba(0,255,0,1)' },
			{ kind: 'category', properties: { kind: 'shop' }, value: 'rgba(255,0,0,1)' },
			{ kind: 'default', properties: {}, value: 'rgba(0,0,255,1)' }
		]);
		expect(classifyLayer(fill, { zoom: 0 })[1].label).toEqual({
			kind: 'category',
			values: ['shop', 'mall']
		});
	});

	it('evaluates the other properties for the same feature', () => {
		const line = layer('line', {
			'line-color': ['match', ['get', 'size'], 100, '#ff0000', 200, '#00ff00', '#000000'],
			'line-width': ['match', ['get', 'size'], 100, 2, 200, 4, 1]
		});
		expect(summary(line, 0, 'line-width').map((c) => c.value)).toEqual([2, 4, 1]);
	});

	it('sees through wrappers and let/var', () => {
		const fill = layer('fill', {
			'fill-color': [
				'let',
				'k',
				['downcase', ['to-string', ['get', 'kind']]],
				['match', ['var', 'k'], 'park', '#00ff00', '#000000']
			]
		});
		expect(summary(fill)[0]).toEqual({
			kind: 'category',
			properties: { kind: 'park' },
			value: 'rgba(0,255,0,1)'
		});
	});

	it('substitutes the branch when the input is not a field', () => {
		const fill = layer('fill', {
			'fill-color': ['match', ['geometry-type'], 'Point', '#ff0000', '#00ff00']
		});
		expect(summary(fill)).toEqual([
			{ kind: 'category', properties: {}, value: 'rgba(255,0,0,1)' },
			{ kind: 'default', properties: {}, value: 'rgba(0,255,0,1)' }
		]);
	});

	it('finds a match nested inside a zoom interpolate, whose values follow the zoom', () => {
		const fill = layer('fill', {
			'fill-color': [
				'interpolate',
				['linear'],
				['zoom'],
				10,
				['match', ['get', 'kind'], 'park', '#000000', '#ffffff'],
				20,
				['match', ['get', 'kind'], 'park', '#00ff00', '#ffffff']
			]
		});
		expect(summary(fill, 10).map((c) => c.properties)).toEqual([{ kind: 'park' }, {}]);
		expect(summary(fill, 10)[0].value).toBe('rgba(0,0,0,1)');
		expect(summary(fill, 20)[0].value).toBe('rgba(0,255,0,1)');
	});
});

describe('classifyLayer: case', () => {
	const fill = layer('fill', {
		'fill-color': [
			'case',
			['==', ['get', 'kind'], 'park'],
			'#00ff00',
			['in', ['get', 'kind'], ['literal', ['shop', 'mall']]],
			'#ff0000',
			['has', 'protected'],
			'#0000ff',
			['>', ['length', ['get', 'name']], 10],
			'#ffff00',
			'#000000'
		]
	});

	it('synthesizes a feature for each condition and checks it', () => {
		const classes = summary(fill);
		expect(classes.slice(0, 3)).toEqual([
			{ kind: 'category', properties: { kind: 'park' }, value: 'rgba(0,255,0,1)' },
			{ kind: 'category', properties: { kind: 'shop' }, value: 'rgba(255,0,0,1)' },
			// the earlier conditions are negated: not `park`, not `shop` or `mall`
			{ kind: 'category', properties: { kind: 'shop_', protected: true }, value: 'rgba(0,0,255,1)' }
		]);
	});

	it('substitutes the branch for a condition which cannot be synthesized', () => {
		expect(summary(fill)[3]).toEqual({
			kind: 'category',
			properties: {},
			value: 'rgba(255,255,0,1)'
		});
	});

	it('substitutes the default when a condition fails to evaluate for every feature tried', () => {
		// `["length", null]` throws, so no synthesized feature reaches the fallback
		expect(summary(fill)[4]).toEqual({ kind: 'default', properties: {}, value: 'rgba(0,0,0,1)' });
	});
});

describe('classifyLayer: step and interpolate', () => {
	it('gives the intervals of a step, represented by midpoints', () => {
		const fill = layer('fill', {
			'fill-color': ['step', ['get', 'pop'], '#000000', 100, '#555555', 1000, '#ffffff']
		});
		const classes = classifyLayer(fill, { zoom: 0 });
		expect(classes.map((c) => c.label)).toEqual([
			{ kind: 'range', min: undefined, max: 100 },
			{ kind: 'range', min: 100, max: 1000 },
			{ kind: 'range', min: 1000, max: undefined }
		]);
		expect(classes.map((c) => c.properties.pop)).toEqual([-350, 550, 1450]);
		expect(classes.map((c) => c.layer.paint['fill-color'])).toEqual([
			'rgba(0,0,0,1)',
			'rgba(85,85,85,1)',
			'rgba(255,255,255,1)'
		]);
	});

	it('gives the stops of an interpolate', () => {
		const circle = layer('circle', {
			'circle-radius': ['interpolate', ['linear'], ['get', 'pop'], 0, 2, 100, 10]
		});
		expect(summary(circle, 0, 'circle-radius')).toEqual([
			{ kind: 'stop', properties: { pop: 0 }, value: 2 },
			{ kind: 'stop', properties: { pop: 100 }, value: 10 }
		]);
	});

	it('converts legacy property functions', () => {
		const fill = layer('fill', {
			'fill-color': {
				property: 'pop',
				type: 'exponential',
				stops: [
					[0, '#000000'],
					[10, '#ffffff']
				]
			},
			'fill-opacity': {
				property: 'pop',
				type: 'interval',
				stops: [
					[0, 0.2],
					[5, 0.8]
				],
				default: 1
			}
		});
		const classes = classifyLayer(fill, { zoom: 0 });
		expect(classes.map((c) => [c.kind, c.properties])).toEqual([
			['stop', { pop: 0 }],
			['stop', { pop: 10 }]
		]);
		expect(classes.map((c) => c.layer.paint['fill-opacity'])).toEqual([0.2, 0.8]);
	});

	it('looks through the type guard which legacy functions with a default get', () => {
		const fill = layer('fill', {
			'fill-opacity': {
				property: 'pop',
				type: 'interval',
				stops: [
					[0, 0.2],
					[5, 0.8]
				],
				default: 1
			}
		});
		// the first stop of an interval function only gives the first output: `< 5`, `≥ 5`
		const classes = classifyLayer(fill, { zoom: 0 });
		expect(classes.map((c) => c.label)).toEqual([
			{ kind: 'range', min: undefined, max: 5 },
			{ kind: 'range', min: 5, max: undefined }
		]);
		expect(classes.map((c) => c.layer.paint['fill-opacity'])).toEqual([0.2, 0.8]);
	});
});

describe('classifyLayer: single', () => {
	it('gives one class which follows the zoom for zoom-only expressions', () => {
		const line = layer('line', {
			'line-color': '#ff0000',
			'line-width': {
				stops: [
					[10, 1],
					[20, 11]
				]
			}
		});
		expect(summary(line, 15, 'line-width')).toEqual([{ kind: 'single', properties: {}, value: 6 }]);
		expect(summary(line, 20, 'line-width')[0].value).toBe(11);
	});

	it('gives one class for a layer type without axes', () => {
		const raster = layer('raster', { 'raster-opacity': 0.5 });
		expect(summary(raster, 0, 'raster-opacity')).toEqual([
			{ kind: 'single', properties: {}, value: 0.5 }
		]);
	});

	it('gives one class when the classifying property is broken', () => {
		const fill = layer('fill', { 'fill-color': ['match', ['get', 'kind']] });
		expect(summary(fill)).toEqual([{ kind: 'single', properties: {}, value: 'rgba(0,0,0,1)' }]);
	});
});

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

const fill = (filter: unknown, paint: Record<string, unknown>) =>
	({ id: 'f', type: 'fill', source: 's', filter, paint }) as unknown as LayerSpecification;

const rows = (layer: LayerSpecification) =>
	classifyLayer(layer, { zoom: 0 }).map((c) => ({
		kind: c.kind,
		properties: c.properties,
		color: c.layer.paint['fill-color'],
		opacity: c.layer.paint['fill-opacity']
	}));

describe('a filter on the classification field', () => {
	const paint = {
		'fill-color': ['match', ['get', 'class'], 'a', '#f00', 'b', '#0f0', '#00f'],
		'fill-opacity': ['match', ['get', 'class'], 'a', 1, 'b', 0.8, 0.5]
	};

	it('does not give the default row the value of another class', () => {
		for (const filter of [
			['in', 'class', 'a', 'b'],
			['==', 'class', 'a']
		]) {
			expect(rows(fill(filter, paint))[2]).toEqual({
				kind: 'default',
				properties: {},
				color: 'rgba(0,0,255,1)',
				opacity: 0.5
			});
		}
	});

	it('keeps the other seeded fields', () => {
		const filter = ['all', ['==', 'class', 'a'], ['==', 'kind', 'x']];
		expect(rows(fill(filter, paint)).map((r) => r.properties)).toEqual([
			{ kind: 'x', class: 'a' },
			{ kind: 'x', class: 'b' },
			{ kind: 'x' }
		]);
	});

	it('applies to a step and a case on the seeded field', () => {
		const step = fill(['==', 'n', 12], {
			'fill-color': ['step', ['get', 'n'], '#f00', 10, '#0f0'],
			'fill-opacity': ['step', ['get', 'n'], 0.2, 10, 0.9]
		});
		expect(rows(step).map((r) => [r.properties, r.opacity])).toEqual([
			// the step's own representatives, not the filter's 12
			[{ n: 5 }, 0.2],
			[{ n: 15 }, 0.9]
		]);
		const kase = fill(['==', 'class', 'a'], {
			'fill-color': ['case', ['==', ['get', 'class'], 'a'], '#f00', '#00f'],
			'fill-opacity': ['case', ['==', ['get', 'class'], 'a'], 1, 0.5]
		});
		expect(rows(kase).map((r) => [r.kind, r.properties, r.opacity])).toEqual([
			['category', { class: 'a' }, 1],
			['default', { class: 'a_' }, 0.5]
		]);
	});
});

describe('seedFromFilter types', () => {
	it('does not create $id', () => {
		expect(seedFromFilter(['==', '$id', 5])).toEqual({ properties: {} });
		expect(seedFromFilter(['in', '$id', 1, 2])).toEqual({ properties: {} });
		expect(seedFromFilter(['==', ['id'], 5])).toEqual({ properties: {} });
	});

	it('seeds through type assertions of the same type only', () => {
		expect(seedFromFilter(['==', ['to-string', ['get', 'n']], '5'])).toEqual({ properties: {} });
		expect(seedFromFilter(['==', ['to-number', ['get', 'n']], 5])).toEqual({ properties: {} });
		expect(seedFromFilter(['==', ['downcase', ['get', 'k']], 'a'])).toEqual({ properties: {} });
		expect(seedFromFilter(['==', ['number', ['get', 'n']], 5])).toEqual({ properties: { n: 5 } });
		expect(seedFromFilter(['==', ['string', ['get', 'n']], 5])).toEqual({ properties: {} });
		expect(seedFromFilter(['in', ['to-string', ['get', 'k']], ['literal', ['a']]])).toEqual({
			properties: {}
		});
		expect(seedFromFilter(['match', ['string', ['get', 'k']], ['a', 'b'], true, false])).toEqual({
			properties: { k: 'a' }
		});
	});
});
