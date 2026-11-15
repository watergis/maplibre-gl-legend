import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { classifyLayer } from '../test-utils';

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
