import { describe, expect, it } from 'vitest';
import { findClassifierNodes } from './find-node';

const findClassifierNode = (expr: unknown, zoom = 0) => {
	const nodes = findClassifierNodes(expr, zoom);
	expect(nodes.length).toBeLessThanOrEqual(1);
	return nodes[0];
};

describe('findClassifierNode', () => {
	it('ignores expressions which only depend on the zoom', () => {
		expect(findClassifierNode(['interpolate', ['linear'], ['zoom'], 1, 1, 10, 5])).toBeUndefined();
		expect(findClassifierNode(['step', ['zoom'], 1, 10, 5])).toBeUndefined();
		expect(findClassifierNode(['literal', ['match', ['get', 'a'], 1, 2, 3]])).toBeUndefined();
		expect(findClassifierNode('#ff0000')).toBeUndefined();
	});

	it('finds the node inside a zoom step and coalesce, with its path', () => {
		const match = ['match', ['get', 'a'], 'x', 1, 0];
		const found = findClassifierNode(['step', ['zoom'], 0, 10, ['coalesce', match, 2]], 12);
		expect(found?.kind).toBe('match');
		expect(found?.path).toEqual([4, 1]);
		expect(found?.node).toBe(match);
	});

	it('takes the first feature-dependent node depth-first', () => {
		const found = findClassifierNode([
			'case',
			['==', ['zoom'], 1],
			['step', ['get', 'n'], 0, 5, 1],
			['interpolate', ['linear'], ['get', 'n'], 0, 0, 5, 1]
		]);
		expect(found?.kind).toBe('step');
	});

	it('resolves the variables of let', () => {
		const found = findClassifierNode([
			'let',
			'v',
			['get', 'a'],
			['match', ['var', 'v'], 'x', 1, 0]
		]);
		expect(found?.path).toEqual([3]);
		expect(found?.resolved[1]).toEqual(['get', 'a']);
	});

	it('looks through the type guards of converted legacy functions', () => {
		const step = ['step', ['number', ['get', 'n']], 0, 5, 1];
		const found = findClassifierNode(['case', ['==', ['typeof', ['get', 'n']], 'number'], step, 1]);
		expect(found?.kind).toBe('step');
		expect(found?.node).toBe(step);
	});

	it('only looks into the branch of a zoom step which is active at the zoom', () => {
		const low = ['match', ['get', 'a'], 'x', 1, 0];
		const high = ['match', ['get', 'b'], 'y', 1, 0];
		const expr = ['step', ['zoom'], low, 10, high];
		expect(findClassifierNode(expr, 5)?.node).toBe(low);
		expect(findClassifierNode(expr, 10)?.node).toBe(high);
		expect(findClassifierNode(expr, 12)?.path).toEqual([4]);
	});

	it('takes both stops around the zoom when they classify the same input', () => {
		const a = ['match', ['get', 'k'], 'a', 1, 0];
		const b = ['match', ['get', 'k'], 'a', 1, 'b', 2, 0];
		const expr = ['interpolate', ['linear'], ['zoom'], 5, a, 15, b];
		expect(findClassifierNodes(expr, 12).map((n) => n.node)).toEqual([a, b]);
		expect(findClassifierNodes(expr, 15).map((n) => n.node)).toEqual([b]);
		expect(findClassifierNodes(expr, 2).map((n) => n.node)).toEqual([a]);
		expect(findClassifierNodes(expr, 20).map((n) => n.node)).toEqual([b]);
	});

	it('takes the nearer stop when the two classify differently', () => {
		const a = ['match', ['get', 'k'], 'a', 1, 0];
		const b = ['step', ['get', 'n'], 0, 5, 1];
		const expr = ['interpolate', ['linear'], ['zoom'], 5, a, 15, b];
		expect(findClassifierNodes(expr, 8).map((n) => n.node)).toEqual([a]);
		expect(findClassifierNodes(expr, 12).map((n) => n.node)).toEqual([b]);
		const onlyHigh = ['interpolate', ['linear'], ['zoom'], 5, 0, 15, b];
		expect(findClassifierNodes(onlyHigh, 6).map((n) => n.node)).toEqual([b]);
	});
});
