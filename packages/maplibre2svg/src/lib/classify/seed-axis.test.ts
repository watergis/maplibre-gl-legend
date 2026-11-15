import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { seedFromFilter } from './filter-seed';
import { classifyLayer } from '../test-utils';

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
