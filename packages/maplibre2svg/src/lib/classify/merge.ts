import type { ClassifierNode } from './find-node';
import type { ClassCandidate } from './types';

/** A class with the node it was made from, which a substitution replaces */
export type NodeCandidate = ClassCandidate & { found: ClassifierNode };

const key = (candidate: ClassCandidate) => JSON.stringify(candidate.label);

/**
 * Merge the classes of the nodes found around the zoom (the stops of a zoom `interpolate`):
 * the classes of the first node, then the ones of the next which are new, and the default of
 * the first node last.
 */
export function mergeCandidates(lists: NodeCandidate[][]): NodeCandidate[] {
	const seen = new Set<string>();
	const merged: NodeCandidate[] = [];
	let fallback: NodeCandidate | undefined;
	for (const list of lists) {
		for (const candidate of list) {
			if (candidate.kind === 'default') {
				fallback ??= candidate;
				continue;
			}
			if (seen.has(key(candidate))) continue;
			seen.add(key(candidate));
			merged.push(candidate);
		}
	}
	const result = fallback ? [...merged, fallback] : merged;
	return markStopBounds(result);
}

/** Mark the lowest and the highest of two or more stops as the bounds of the range */
function markStopBounds(candidates: NodeCandidate[]): NodeCandidate[] {
	const values = candidates.flatMap((c) =>
		c.label.kind === 'stop' && typeof c.label.value === 'number' ? [c.label.value] : []
	);
	if (values.length < 2) return candidates;
	const [min, max] = [Math.min(...values), Math.max(...values)];
	return candidates.map((c) => {
		if (c.label.kind !== 'stop' || (c.label.value !== min && c.label.value !== max)) return c;
		return { ...c, label: { ...c.label, bound: c.label.value === min ? 'lower' : 'upper' } };
	});
}
