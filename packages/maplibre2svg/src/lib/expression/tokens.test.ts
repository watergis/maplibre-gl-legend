import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { evaluateLayer } from './layer';
import { resolveTokens } from './tokens';

const symbol = (layout: Record<string, unknown>) =>
	({ id: 's', type: 'symbol', source: 's', layout }) as unknown as LayerSpecification;

describe('legacy {token} strings', () => {
	it('fills tokens, and missing fields with an empty string', () => {
		expect(resolveTokens('{name} {id}', { name: 'A', id: 3 })).toEqual({
			text: 'A 3',
			missing: []
		});
		expect(resolveTokens('mark_{k}{k}', {})).toEqual({ text: 'mark_', missing: ['k'] });
	});

	it('resolves text-field and icon-image for the representative feature', () => {
		const layer = symbol({ 'icon-image': 'mark_{k}', 'text-field': '{name} ({id})' });
		const evaluated = evaluateLayer(layer, { zoom: 0, properties: { k: 'on', name: 'X', id: 1 } });
		expect(evaluated.layout['icon-image']).toBe('mark_on');
		expect(evaluated.layout['text-field']).toBe('X (1)');
		expect(evaluated.unresolvedTokens).toEqual({});
	});

	it('records the tokens which could not be filled', () => {
		const layer = symbol({ 'icon-image': 'mark_{k}', 'text-field': '{name} {id}' });
		const evaluated = evaluateLayer(layer, { zoom: 0, properties: { id: 7 } });
		expect(evaluated.layout['icon-image']).toBe('mark_');
		expect(evaluated.layout['text-field']).toBe(' 7');
		expect(evaluated.unresolvedTokens).toEqual({
			'icon-image': { template: 'mark_{k}', fields: ['k'] },
			'text-field': { template: '{name} {id}', fields: ['name'] }
		});
	});

	it('leaves strings of properties without tokens and expressions alone', () => {
		const layer = symbol({ 'text-field': ['get', 'name'], 'text-anchor': 'top' });
		const evaluated = evaluateLayer(layer, { zoom: 0, properties: { name: '{x}' } });
		expect(evaluated.layout['text-field']).toBe('{x}');
		expect(evaluated.unresolvedTokens).toEqual({});
	});
});
