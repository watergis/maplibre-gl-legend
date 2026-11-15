import type { ClassifierNode } from './find-node';
import { synthesize } from './synthesize';
import type { ClassCandidate, FeatureProperties } from './types';
import { evaluatePart, type ClassifyContext } from './verify';

/**
 * Index of the branch which a `case` takes for the properties: the first condition which
 * holds, or -1 for the fallback. Undefined when a condition up to that one fails to
 * evaluate, since the `case` itself would then fail and the property fall back to its default.
 */
function branchTaken(
	conditions: unknown[],
	properties: FeatureProperties,
	ctx: ClassifyContext
): number | undefined {
	for (let i = 0; i < conditions.length; i++) {
		const result = evaluatePart(conditions[i], properties, ctx);
		if (result === undefined || typeof result.value !== 'boolean') return undefined;
		if (result.value) return i;
	}
	return -1;
}

/**
 * Properties to try for the branch at `index` (-1 for the fallback): what makes its own
 * condition hold, over what makes the earlier ones not hold. Negations can set the same field
 * differently, so they are tried merged in both orders and one at a time.
 */
function attempts(conditions: unknown[], index: number): FeatureProperties[] {
	const own = index === -1 ? {} : synthesize(conditions[index]);
	if (own === undefined) return [];
	const earlier = index === -1 ? conditions : conditions.slice(0, index);
	const negations = earlier
		.map((c) => synthesize(c, true))
		.filter((p): p is FeatureProperties => p !== undefined);
	const merged = (list: FeatureProperties[]) => Object.assign({}, ...list, own);
	return [
		merged(negations),
		merged([...negations].reverse()),
		...negations.map((negation) => merged([negation])),
		own
	];
}

/** Properties under which the `case` takes the branch at `index`, checked by evaluation */
function representative(conditions: unknown[], index: number, ctx: ClassifyContext) {
	return attempts(conditions, index).find((p) => branchTaken(conditions, p, ctx) === index);
}

/**
 * Classes of `["case", condition1, output1, ..., fallback]`: one per condition and the
 * fallback. A branch which no properties can be found for, because its condition cannot be
 * worked out or an earlier condition shadows it, gets its output substituted for the node.
 */
export function caseClasses(found: ClassifierNode, ctx: ClassifyContext): ClassCandidate[] {
	const node = found.resolved;
	const conditions: unknown[] = [];
	for (let i = 1; i < node.length - 1; i += 2) conditions.push(node[i]);

	const classes: ClassCandidate[] = conditions.map((condition, i) => {
		const properties = representative(conditions, i, ctx);
		return {
			kind: 'category',
			label: { kind: 'condition', condition, index: i },
			properties: properties ?? {},
			substitute: properties ? undefined : { output: found.node[2 + 2 * i] }
		};
	});

	const none = representative(conditions, -1, ctx);
	classes.push({
		kind: 'default',
		label: { kind: 'default' },
		properties: none ?? {},
		substitute: none ? undefined : { output: found.node[found.node.length - 1] }
	});
	return classes;
}
