import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { MockSource } from '../../stories/mock-source';
import type { LegendViewNode } from '../tree/legend-view';
import { LegendModel } from './legend-model.svelte';

const layers = (...ids: string[]) =>
	ids.map((id) => ({ id, type: 'fill', source: 'src' }) as LayerSpecification);

const ids = (nodes: LegendViewNode[]): string[] =>
	nodes.flatMap((node) => (node.type === 'layer' ? [node.layer.id] : ids(node.children)));

const none = () => Promise.resolve({ type: 'none' as const });
const error = () => Promise.resolve({ type: 'error' as const });

describe('LegendModel', () => {
	it('lists the targets, top-most layer first', () => {
		const source = new MockSource({ layers: layers('a', 'b', 'c'), createSymbol: error });
		const model = new LegendModel(source, { a: 'A', c: 'C' });
		model.refresh();
		expect(ids(model.view)).toEqual(['c', 'a']);
		const model2 = new LegendModel(source, {}, { reverseOrder: false });
		model2.refresh();
		expect(ids(model2.view)).toEqual(['a', 'b', 'c']);
	});

	it('lists only rendered layers with "Only rendered", keeping the layers hidden with a toggle', () => {
		const source = new MockSource({
			layers: layers('a', 'b', 'c'),
			rendered: ['a', 'b'],
			createSymbol: error
		});
		const model = new LegendModel(source, {});
		model.refresh();
		expect(ids(model.view)).toEqual(['b', 'a']);

		model.setLayersVisibility(['a'], false);
		model.refresh();
		// a is not rendered any more, but stays listed so that it can be shown again
		expect(ids(model.view)).toEqual(['b', 'a']);
		expect(model.toggleState(['a'])).toBe('hidden');

		model.setOnlyRendered(false);
		expect(ids(model.view)).toEqual(['c', 'b', 'a']);
	});

	it('keeps a layer shown again listed until the map draws it', () => {
		const source = new MockSource({ layers: layers('a', 'b'), createSymbol: error });
		const model = new LegendModel(source, {});
		model.refresh();
		model.setLayersVisibility(['a'], false);
		model.refresh();

		// the refresh right after the toggle runs before the map draws the layer
		source.rendered.delete('a');
		model.setLayersVisibility(['a'], true);
		model.refresh();
		expect(ids(model.view)).toEqual(['b', 'a']);
		expect(model.toggleState(['a'])).toBe('visible');

		// still not rendered at the next refresh (e.g. out of the view): no longer listed
		model.refresh();
		expect(ids(model.view)).toEqual(['b']);
	});

	it('does not list the layers of a group out of the view when the group is hidden', () => {
		const source = new MockSource({
			layers: layers('a', 'b'),
			rendered: ['a'],
			createSymbol: error
		});
		const model = new LegendModel(source, {}, { groups: { G: ['a', 'b'] } });
		model.refresh();
		expect(ids(model.view)).toEqual(['a']);
		model.setLayersVisibility(['a', 'b'], false);
		model.refresh();
		expect(ids(model.view)).toEqual(['a']);
	});

	it('tells the state of a group toggle', () => {
		const source = new MockSource({ layers: layers('a', 'b'), createSymbol: error });
		const model = new LegendModel(source, {}, { groups: { G: ['a', 'b'] } });
		model.refresh();
		expect(model.toggleState(['a', 'b'])).toBe('visible');
		model.setLayersVisibility(['a'], false);
		expect(model.toggleState(['a', 'b'])).toBe('partial');
		expect(source.isLayerVisible('a')).toBe(false);
		model.setLayersVisibility(['a', 'b'], false);
		expect(model.toggleState(['a', 'b'])).toBe('hidden');
	});

	it('keeps the collapsed state of the groups between refreshes', () => {
		const source = new MockSource({ layers: layers('a', 'b'), createSymbol: error });
		const model = new LegendModel(source, {}, { groups: { G: ['a', 'b'] }, collapseGroups: true });
		model.refresh();
		expect(model.isCollapsed('group:G')).toBe(true);
		model.setCollapsed('group:G', false);
		model.refresh();
		expect(model.isCollapsed('group:G')).toBe(false);
	});

	it('knows the layers without a legend once their symbol is drawn', async () => {
		const source = new MockSource({ layers: layers('a'), createSymbol: none });
		const model = new LegendModel(source, {});
		model.refresh();
		expect(model.hasNoLegend('a')).toBe(false);
		await model.symbol('a');
		await Promise.resolve();
		expect(model.hasNoLegend('a')).toBe(true);
	});

	it('opens the style editor through the source', () => {
		const source = new MockSource({ layers: layers('a'), createSymbol: error });
		new LegendModel(source, {}).openStyleEditor('a', 'A');
		expect(source.editedLayers).toEqual(['a']);
	});
});
