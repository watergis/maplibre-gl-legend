import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { GroupTreeBuilder, type GroupTreeOptions } from './group-tree-builder';
import { buildLegendView, type LegendViewNode } from './legend-view';

const layer = (id: string, sourceLayer?: string): LayerSpecification =>
	(sourceLayer
		? { id, type: 'fill', source: 'src', 'source-layer': sourceLayer }
		: { id, type: 'fill', source: 'src' }) as LayerSpecification;

/** the rows as a plain object: a layer row is `depth:id` (`*` for a group shown as a layer), a group is `{ depth:title: rows }` */
const shape = (nodes: LegendViewNode[]): unknown[] =>
	nodes.map((node) =>
		node.type === 'layer'
			? `${node.depth}:${node.layer.id}${node.group ? '*' : ''}`
			: { [`${node.depth}:${node.title}`]: shape(node.children) }
	);

const view = (
	options: GroupTreeOptions,
	listed: LayerSpecification[],
	shown: string[] = listed.map((l) => l.id),
	all = listed
) =>
	buildLegendView(
		new GroupTreeBuilder(options).build(listed, all),
		(l) => shown.includes(l.id),
		(l) => l.id
	);

describe('buildLegendView', () => {
	it('lists the shown layers and nested groups with their depth', () => {
		const rows = view(
			{ groups: { A: [{ B: ['b1', 'b2'] }, 'a'] } },
			['a', 'b1', 'b2', 'x'].map((id) => layer(id))
		);
		expect(shape(rows)).toEqual([{ '0:A': ['1:a', { '1:B': ['2:b1', '2:b2'] }] }, '0:x']);
	});

	it('does not list layers and groups not shown', () => {
		const rows = view(
			{ groups: { A: [{ B: ['b1', 'b2'] }, 'a'] } },
			['a', 'b1', 'b2'].map((id) => layer(id)),
			['a']
		);
		// A has 3 listed layers: it stays a group with one layer shown
		expect(shape(rows)).toEqual([{ '0:A': ['1:a'] }]);
		expect(view({ groups: { A: ['a'] } }, [layer('a')], [])).toEqual([]);
	});

	it('shows a group with one listed layer as a layer switching the whole group', () => {
		const all = ['a', 'a-label', 'b', 'c'].map((id) => layer(id));
		const listed = all.filter((l) => l.id !== 'a-label');
		const rows = view(
			{ groups: { Top: [{ A: ['a', 'a-label'] }, 'b', 'c'] } },
			listed,
			listed.map((l) => l.id),
			all
		);
		expect(shape(rows)).toEqual([{ '0:Top': ['1:a*', '1:b', '1:c'] }]);
		const top = rows[0];
		if (top.type !== 'group') throw new Error('not a group');
		const a = top.children[0];
		expect(a.toggleLayerIds).toEqual(['a', 'a-label']);
		expect(top.toggleLayerIds).toEqual(['a', 'a-label', 'b', 'c']);
	});

	it('shows a source-layer group with one shown layer as the layer alone', () => {
		const listed = [layer('a', 'roads'), layer('b', 'roads')];
		const rows = view({ groupBySourceLayer: true }, listed, ['b']);
		expect(shape(rows)).toEqual(['0:b']);
		expect(rows[0].toggleLayerIds).toEqual(['b']);
	});
});
