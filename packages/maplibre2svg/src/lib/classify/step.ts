import type { ClassifierNode } from './find-node';
import { propertiesFor } from './match';
import type { ClassCandidate } from './types';
import { inputPasses, type ClassifyContext } from './verify';

/** A value inside `[min, max)`: the midpoint, or half an interval beyond an open end */
function representative(min: number | undefined, max: number | undefined, width: number) {
	if (min !== undefined && max !== undefined) return (min + max) / 2;
	if (max !== undefined) return max - width / 2;
	return (min as number) + width / 2;
}

/**
 * Classes of `["step", input, output0, t1, output1, ..., tn, outputn]`: `< t1`,
 * `t1 – t2`, ..., `≥ tn`, represented by the midpoints of the intervals.
 */
export function stepClasses(found: ClassifierNode, ctx: ClassifyContext): ClassCandidate[] {
	const node = found.resolved;
	const input = node[1];
	const thresholds: number[] = [];
	for (let i = 3; i < node.length; i += 2) thresholds.push(Number(node[i]));
	if (thresholds.length === 0 || thresholds.some((t) => !Number.isFinite(t))) return [];

	// width given to the open ends: the narrowest closed interval, or the size of the only threshold
	const width =
		thresholds.length > 1
			? Math.min(...thresholds.slice(1).map((t, i) => t - thresholds[i]))
			: Math.abs(thresholds[0]) || 1;

	return [undefined, ...thresholds].map((min, i) => {
		const max = thresholds[i] as number | undefined;
		const properties = propertiesFor(input, representative(min, max, width));
		const ok = inputPasses(
			input,
			properties,
			ctx,
			(v) =>
				typeof v === 'number' && (min === undefined || v >= min) && (max === undefined || v < max)
		);
		return {
			kind: 'range',
			label: { kind: 'range', min, max },
			properties: ok && properties ? properties : {},
			// output i sits at index 2 + 2i of the node
			substitute: ok ? undefined : { output: found.node[2 + 2 * i] }
		};
	});
}
