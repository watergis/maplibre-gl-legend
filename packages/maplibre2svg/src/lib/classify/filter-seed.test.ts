import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { seedFromFilter } from './filter-seed';
import { classifyLayer } from '../test-utils';

/** Filters of the unvt style (narwassco.github.io/mapbox-stylefiles/unvt/style.json) */
const POI_RAILWAY = [
	'all',
	['==', '$type', 'Point'],
	['has', 'name'],
	['==', 'class', 'railway'],
	['==', 'subclass', 'station']
];
const SHIELD_INTERSTATE = [
	'all',
	['<=', 'ref_length', 6],
	['==', '$type', 'LineString'],
	['in', 'network', 'us-interstate']
];
const SHIELD_OTHER = [
	'all',
	['<=', 'ref_length', 6],
	['==', '$type', 'LineString'],
	['in', 'network', 'us-highway', 'us-state']
];
const SHIELD = [
	'all',
	['<=', 'ref_length', 6],
	['==', '$type', 'LineString'],
	['!in', 'network', 'us-interstate', 'us-highway', 'us-state']
];
const POI_LEVEL_1 = [
	'all',
	['==', '$type', 'Point'],
	['<=', 'rank', 14],
	['has', 'name'],
	['any', ['!has', 'level'], ['==', 'level', 0]]
];

describe('seedFromFilter', () => {
	it('reads legacy equalities, the first value of in, and $type, through all', () => {
		expect(seedFromFilter(POI_RAILWAY)).toEqual({
			properties: { class: 'railway', subclass: 'station' },
			geometryType: 'Point'
		});
		expect(seedFromFilter(SHIELD_INTERSTATE)).toEqual({
			properties: { network: 'us-interstate' },
			geometryType: 'LineString'
		});
		expect(seedFromFilter(SHIELD_OTHER).properties).toEqual({ network: 'us-highway' });
	});

	it('ignores negations, comparisons, has and any', () => {
		expect(seedFromFilter(SHIELD)).toEqual({ properties: {}, geometryType: 'LineString' });
		expect(seedFromFilter(POI_LEVEL_1)).toEqual({ properties: {}, geometryType: 'Point' });
		expect(seedFromFilter(['any', ['==', 'a', 1], ['==', 'a', 2]])).toEqual({ properties: {} });
		expect(seedFromFilter(['!', ['==', ['get', 'a'], 1]])).toEqual({ properties: {} });
	});

	it('reads expression filters', () => {
		expect(
			seedFromFilter([
				'all',
				['==', ['get', 'class'], 'park'],
				['==', 3, ['get', 'rank']],
				['in', ['get', 'kind'], ['literal', ['a', 'b']]],
				['match', ['get', 'status'], ['ON', 'OFF'], true, false],
				['==', ['geometry-type'], 'MultiPolygon']
			])
		).toEqual({
			properties: { class: 'park', rank: 3, kind: 'a', status: 'ON' },
			geometryType: 'Polygon'
		});
		expect(seedFromFilter(['match', ['geometry-type'], ['LineString'], true, false])).toEqual({
			properties: {},
			geometryType: 'LineString'
		});
	});

	it('says nothing for what it does not know', () => {
		expect(seedFromFilter(undefined)).toEqual({ properties: {} });
		expect(seedFromFilter(['within', {}])).toEqual({ properties: {} });
		expect(seedFromFilter(['==', 'a', ['literal', [1]]])).toEqual({ properties: {} });
	});
});

describe('the seed in the classes', () => {
	it('is the base of every representative feature; the class wins', () => {
		const layer = {
			id: 'roads',
			type: 'line',
			source: 's',
			filter: ['all', ['==', 'class', 'primary'], ['==', 'kind', 'x']],
			paint: { 'line-color': ['match', ['get', 'kind'], 'a', '#f00', '#00f'] },
			layout: {}
		} as unknown as LayerSpecification;
		expect(classifyLayer(layer, { zoom: 0 }).map((c) => c.properties)).toEqual([
			{ class: 'primary', kind: 'a' },
			// `kind` is what the classes decide: the filter's value is not inherited
			{ class: 'primary' }
		]);
	});

	it('fills {tokens} and expressions with the seeded properties and geometry', () => {
		const layer = {
			id: 'poi-railway',
			type: 'symbol',
			source: 's',
			filter: POI_RAILWAY,
			layout: {
				'icon-image': '{class}_11',
				'text-field': ['concat', ['get', 'subclass'], ':', ['geometry-type']]
			}
		} as unknown as LayerSpecification;
		const [single] = classifyLayer(layer, { zoom: 0 });
		expect(single.layer.layout['icon-image']).toBe('railway_11');
		expect(single.layer.unresolvedTokens).toEqual({});
		expect(single.layer.layout['text-field']).toBe('station:Point');
	});
});
