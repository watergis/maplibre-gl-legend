import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import type { LegendGroups } from '../types/legend-groups';
import { GroupTreeBuilder, type GroupTreeOptions } from './group-tree-builder';
import { GroupNode, LayerNode, type LegendNode } from './legend-node';

const layer = (id: string, sourceLayer?: string): LayerSpecification =>
	(sourceLayer
		? { id, type: 'fill', source: 'src', 'source-layer': sourceLayer }
		: { id, type: 'fill', source: 'src' }) as LayerSpecification;

const layers = (...ids: string[]) => ids.map((id) => layer(id));

/** the tree as a plain object: a layer is its ID, a group is `{ title: children }` */
const shape = (nodes: LegendNode[]): unknown[] =>
	nodes.map((node) =>
		node instanceof LayerNode
			? node.layer.id
			: { [(node as GroupNode).title]: shape((node as GroupNode).children) }
	);

const build = (options: GroupTreeOptions, listed: LayerSpecification[], all = listed) =>
	new GroupTreeBuilder(options).build(listed, all);

const findGroup = (nodes: LegendNode[], title: string): GroupNode | undefined => {
	for (const node of nodes) {
		if (!(node instanceof GroupNode)) continue;
		if (node.title === title) return node;
		const found = findGroup(node.children, title);
		if (found) return found;
	}
	return undefined;
};

describe('GroupTreeBuilder', () => {
	it('lists layers without groups as they are', () => {
		expect(shape(build({}, layers('a', 'b')))).toEqual(['a', 'b']);
	});

	it('makes flat groups at the position of their first layer', () => {
		const tree = build({ groups: { G: ['b', 'd'] } }, layers('a', 'b', 'c', 'd'));
		expect(shape(tree)).toEqual(['a', { G: ['b', 'd'] }, 'c']);
		expect(findGroup(tree, 'G')?.toggleLayerIds).toEqual(['b', 'd']);
	});

	it('nests groups in an array next to layers (issue #65)', () => {
		const tree = build(
			{
				groups: {
					'All Points': [
						{ 'Some Points': ['points-halo', 'points-circles'] },
						'points-symbols',
						'points-labels'
					]
				}
			},
			layers('points-labels', 'points-symbols', 'points-circles', 'points-halo')
		);
		expect(shape(tree)).toEqual([
			{
				'All Points': [
					'points-labels',
					'points-symbols',
					{ 'Some Points': ['points-circles', 'points-halo'] }
				]
			}
		]);
		const some = findGroup(tree, 'Some Points')!;
		expect(findGroup(tree, 'All Points')!.toggleLayerIds).toHaveLength(4);
		expect(some.toggleLayerIds.sort()).toEqual(['points-circles', 'points-halo']);
		expect(some.depth).toBe(1);
		expect(some.ancestors().map((g) => g.title)).toEqual(['All Points']);
	});

	it('nests groups as an object of groups', () => {
		const tree = build(
			{
				groups: {
					'Water Facilities': {
						WTP: ['wtp', 'wtp_annotation'],
						Intake: ['intake', 'intake_annotation'],
						Tank: ['tank', 'tank_annotation']
					}
				}
			},
			layers('tank', 'wtp', 'intake', 'wtp_annotation', 'tank_annotation', 'intake_annotation')
		);
		expect(shape(tree)).toEqual([
			{
				'Water Facilities': [
					{ Tank: ['tank', 'tank_annotation'] },
					{ WTP: ['wtp', 'wtp_annotation'] },
					{ Intake: ['intake', 'intake_annotation'] }
				]
			}
		]);
		expect(findGroup(tree, 'Water Facilities')!.toggleLayerIds).toHaveLength(6);
	});

	it('nests groups to any depth', () => {
		const tree = build(
			{ groups: { L1: ['a', { L2: ['b', { L3: { L4: ['d'], L3b: ['c'] } }] }] } },
			layers('a', 'b', 'c', 'd')
		);
		expect(shape(tree)).toEqual([
			{ L1: ['a', { L2: ['b', { L3: [{ L3b: ['c'] }, { L4: ['d'] }] }] }] }
		]);
		const l4 = findGroup(tree, 'L4')!;
		expect(l4.depth).toBe(3);
		expect(l4.ancestors().map((g) => g.title)).toEqual(['L1', 'L2', 'L3']);
		expect(findGroup(tree, 'L1')!.toggleLayerIds.sort()).toEqual(['a', 'b', 'c', 'd']);
	});

	it('places a nested group at the position of its first listed layer', () => {
		const tree = build(
			{ groups: { Parent: ['a', { Child: ['c', 'd'] }, 'e'] } },
			layers('c', 'a', 'x', 'e', 'd')
		);
		expect(shape(tree)).toEqual([{ Parent: [{ Child: ['c', 'd'] }, 'a', 'e'] }, 'x']);
	});

	it('switches the layers not listed with the group and its ancestors', () => {
		const all = layers('a', 'a-label', 'b', 'b-label');
		const listed = all.filter((l) => !l.id.endsWith('-label'));
		const tree = build({ groups: { Top: [{ A: ['a', 'a-label'] }, 'b', 'b-label'] } }, listed, all);
		expect(shape(tree)).toEqual([{ Top: [{ A: ['a'] }, 'b'] }]);
		expect(findGroup(tree, 'A')!.toggleLayerIds).toEqual(['a', 'a-label']);
		expect(findGroup(tree, 'Top')!.toggleLayerIds).toEqual(['a', 'a-label', 'b', 'b-label']);
	});

	it('puts a layer in the first group listing it, at any depth', () => {
		const tree = build(
			{ groups: { P1: [{ C: ['c1', 'c2'] }, 'p1'], P2: ['c1', 'p2'] } },
			layers('p1', 'p2', 'c1', 'c2')
		);
		expect(shape(tree)).toEqual([{ P1: ['p1', { C: ['c1', 'c2'] }] }, { P2: ['p2'] }]);
	});

	it('ignores layers not in the style', () => {
		const tree = build({ groups: { G: ['missing', 'a'] } }, layers('a'));
		expect(findGroup(tree, 'G')!.toggleLayerIds).toEqual(['a']);
	});

	it('keeps nested groups of the same title in different groups apart', () => {
		const tree = build(
			{ groups: { A: { Labels: ['a1', 'a2'] }, B: { Labels: ['b1', 'b2'] } } },
			layers('a1', 'a2', 'b1', 'b2')
		);
		expect(shape(tree)).toEqual([
			{ A: [{ Labels: ['a1', 'a2'] }] },
			{ B: [{ Labels: ['b1', 'b2'] }] }
		]);
		const keys = (tree as GroupNode[]).map((g) => (g.children[0] as GroupNode).key);
		expect(new Set(keys).size).toBe(2);
	});

	it('does not loop on a group object nested in itself', () => {
		const groups: LegendGroups = { A: ['a'] };
		groups.B = [groups, 'b'];
		const tree = build({ groups }, layers('a', 'b'));
		expect(shape(tree)).toEqual([{ A: ['a'] }, { B: ['b'] }]);
	});

	it('groups the layers not in groups by source-layer, next to nested groups', () => {
		const listed = [
			layer('a', 'roads'),
			layer('b', 'roads'),
			layer('c', 'water'),
			layer('d', 'water'),
			layer('e', 'land')
		];
		const tree = build(
			{ groups: { Outer: [{ Inner: ['a'] }, 'b'] }, groupBySourceLayer: true },
			listed
		);
		expect(shape(tree)).toEqual([{ Outer: [{ Inner: ['a'] }, 'b'] }, { water: ['c', 'd'] }, 'e']);
		const water = findGroup(tree, 'water')!;
		expect(water.auto).toBe(true);
		expect(water.toggleLayerIds).toEqual(['c', 'd']);
	});
});
