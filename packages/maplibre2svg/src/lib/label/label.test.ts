import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { classifyLayer } from '../test-utils';
import { describeCondition, generateLabel, labelClasses, layerLabelOf } from './index';

const fillLayer = (fillColor: unknown, metadata?: unknown) =>
	({
		id: 'landuse',
		type: 'fill',
		source: 's',
		paint: { 'fill-color': fillColor },
		metadata
	}) as unknown as LayerSpecification;

const MATCH = ['match', ['get', 'kind'], 'park', '#0f0', ['shop', 'mall'], '#f00', '#00f'];

const labels = (layer: LayerSpecification, defaultLabel?: string) =>
	labelClasses(layer, classifyLayer(layer, { zoom: 0 }), { defaultLabel }).map((c) => c.text);

describe('generateLabel', () => {
	it('labels each kind of class', () => {
		expect(generateLabel({ kind: 'single' }, 'roads', 'Other')).toBe('roads');
		expect(generateLabel({ kind: 'default' }, 'roads', 'Other')).toBe('Other');
		expect(generateLabel({ kind: 'category', values: ['a', 1] }, '', '')).toBe('a, 1');
		expect(generateLabel({ kind: 'stop', value: 0.1 + 0.2 }, '', '')).toBe('0.3');
		expect(generateLabel({ kind: 'stop', value: 0, bound: 'lower' }, '', '')).toBe('≤ 0');
		expect(generateLabel({ kind: 'stop', value: 9, bound: 'upper' }, '', '')).toBe('≥ 9');
		expect(generateLabel({ kind: 'range', max: 10 }, '', '')).toBe('< 10');
		expect(generateLabel({ kind: 'range', min: 10, max: 50 }, '', '')).toBe('10 – 50');
		expect(generateLabel({ kind: 'range', min: 50 }, '', '')).toBe('≥ 50');
	});

	it('labels the conditions of a case, or numbers them', () => {
		const condition = (c: unknown, index = 0) =>
			generateLabel({ kind: 'condition', condition: c, index }, '', '');
		expect(condition(['==', ['get', 'kind'], 'park'])).toBe('kind = park');
		expect(condition(['<=', 5, ['get', 'n']])).toBe('n ≥ 5');
		expect(condition(['in', ['get', 'kind'], ['literal', ['a', 'b']]])).toBe('kind = a, b');
		expect(condition(['has', 'protected'])).toBe('has protected');
		expect(condition(['!', ['has', 'protected']])).toBe('not (has protected)');
		expect(condition(['all', ['==', ['get', 'a'], 1], ['>', ['get', 'b'], 2]])).toBe(
			'(a = 1) and (b > 2)'
		);
		expect(condition(['>', ['length', ['get', 'name']], 10], 3)).toBe('Class 4');
		expect(describeCondition(['within', {}])).toBeUndefined();
	});
});

describe('labelClasses', () => {
	it('labels the classes of a match, with the default label of the options', () => {
		expect(labels(fillLayer(MATCH))).toEqual(['park', 'shop, mall', 'Other']);
		expect(labels(fillLayer(MATCH), 'Others')).toEqual(['park', 'shop, mall', 'Others']);
	});

	it('labels a single class with the label of the layer', () => {
		expect(labels(fillLayer('#000'))).toEqual(['landuse']);
		expect(labels(fillLayer('#000', { legend: { label: 'Land use' } }))).toEqual(['Land use']);
		expect(layerLabelOf(fillLayer('#000', { legend: { label: 'Land use' } }))).toBe('Land use');
	});

	it('applies custom-labels by position, default and show-default', () => {
		const meta = { legend: { 'custom-labels': ['Parks'], default: 'Rest' } };
		expect(labels(fillLayer(MATCH, meta))).toEqual(['Parks', 'shop, mall', 'Rest']);
		const hidden = { legend: { 'custom-labels': ['Parks', 'Shops'], 'show-default': false } };
		expect(labels(fillLayer(MATCH, hidden))).toEqual(['Parks', 'Shops']);
	});

	it('applies custom-labels given as a map of generated labels', () => {
		const meta = { legend: { 'custom-labels': { 'shop, mall': 'Shops' } } };
		expect(labels(fillLayer(MATCH, meta))).toEqual(['park', 'Shops', 'Other']);
	});

	it('ignores metadata of the wrong shape', () => {
		const meta = { legend: { label: {}, 'show-default': 'no', 'custom-labels': 3 } };
		expect(labels(fillLayer(MATCH, meta))).toEqual(['park', 'shop, mall', 'Other']);
	});

	it('lets custom-labels override the bounds of interpolate stops', () => {
		const layer = fillLayer(['interpolate', ['linear'], ['get', 'n'], 0, '#000', 10, '#fff'], {
			legend: { 'custom-labels': ['Low'] }
		});
		expect(labels(layer)).toEqual(['Low', '≥ 10']);
	});
});
