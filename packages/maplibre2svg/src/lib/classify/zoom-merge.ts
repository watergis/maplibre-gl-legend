import type { ClassifierNode } from './find-node';
import { mergeCandidates, type NodeCandidate } from './merge';
import type { NodeClassifiers } from './node-classifiers';
import type { ClassCandidate } from './types';
import type { ClassifyContext } from './verify';

const sortedUnique = (values: number[]) =>
	[...new Set(values.filter((v) => Number.isFinite(v)))].sort((a, b) => a - b);

/** The thresholds of a `step` or the stops of an `interpolate`: both sit at 3, 5, ... */
function breaks(node: unknown[]) {
	const values: number[] = [];
	for (let i = 3; i < node.length - 1; i += 2) values.push(Number(node[i]));
	return values;
}

/**
 * A node which stands for the two nodes found around the zoom, on their common input, with
 * their thresholds or stops joined. Its outputs are placeholders: the classes made from it
 * are only kept when none of them needs a substitution.
 */
function joinedNode(a: ClassifierNode, b: ClassifierNode): ClassifierNode {
	const [op] = a.resolved;
	if (a.kind === 'step') {
		const thresholds = sortedUnique([...breaks(a.resolved), ...breaks(b.resolved)]);
		const node = [op, a.resolved[1], 0, ...thresholds.flatMap((t) => [t, 0])];
		return { kind: 'step', node, resolved: node, path: a.path };
	}
	const stops = sortedUnique([...breaks(a.resolved), ...breaks(b.resolved)]);
	const node = [op, a.resolved[1], a.resolved[2], ...stops.flatMap((s) => [s, 0])];
	return { kind: 'interpolate', node, resolved: node, path: a.path };
}

const withNode = (candidates: ClassCandidate[], found: ClassifierNode): NodeCandidate[] =>
	candidates.map((candidate) => ({ ...candidate, found }));

/**
 * The classes of the nodes found on the axis. Two nodes come from the stops of a zoom
 * `interpolate` around the zoom and share kind and input:
 * - `match`: the union of the branches
 * - `step`: one partition by the thresholds of both, so that no ranges overlap
 * - `interpolate`: the union of the stops
 * - otherwise, or when the joined classes cannot all be verified: the nearer node
 */
export function candidatesOfNodes(
	nodes: ClassifierNode[],
	ctx: ClassifyContext,
	classifiers: NodeClassifiers
): NodeCandidate[] {
	const own = (found: ClassifierNode) =>
		withNode(classifiers[found.kind].classify(found, ctx), found);
	if (nodes.length < 2) return mergeCandidates(nodes.map(own));
	const [a, b] = nodes;
	if (a.kind === 'match') return mergeCandidates([own(a), own(b)]);
	if (a.kind === 'step' || a.kind === 'interpolate') {
		const joined = joinedNode(a, b);
		const candidates = classifiers[a.kind].classify(joined, ctx);
		if (candidates.every((c) => !c.substitute)) return mergeCandidates([withNode(candidates, a)]);
	}
	const nearer = (b.distance ?? 0) < (a.distance ?? 0) ? b : a;
	return mergeCandidates([own(nearer)]);
}
