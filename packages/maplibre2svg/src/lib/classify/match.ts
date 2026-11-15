import { fieldOf } from './accessor';
import type { ClassifierNode } from './find-node';
import type { ClassCandidate, FeatureProperties } from './types';
import { inputPasses, type ClassifyContext } from './verify';

/** Properties which give the value to the field which the input reads, if it reads one */
export function propertiesFor(input: unknown, value: unknown): FeatureProperties | undefined {
	const field = fieldOf(input);
	return field === undefined ? undefined : { [field]: value };
}

/**
 * Classes of `["match", input, label1, output1, ..., fallback]`: one per branch, whose
 * representative is the first of its values, and the fallback.
 */
export function matchClasses(found: ClassifierNode, ctx: ClassifyContext): ClassCandidate[] {
	const node = found.resolved;
	const input = node[1];
	// outputs are taken from the node as it is, since they replace it in place
	const fallback = found.node[found.node.length - 1];
	const classes: ClassCandidate[] = [];
	const allValues: unknown[] = [];

	for (let i = 2; i < node.length - 1; i += 2) {
		const values = Array.isArray(node[i]) ? (node[i] as unknown[]) : [node[i]];
		allValues.push(...values);
		const properties = propertiesFor(input, values[0]);
		const ok = inputPasses(input, properties, ctx, (v) => values.includes(v));
		classes.push({
			kind: 'category',
			label: { kind: 'category', values },
			properties: ok && properties ? properties : {},
			substitute: ok ? undefined : { output: found.node[i + 1] }
		});
	}

	// a feature without the field falls to the fallback, unless a wrapper turns null into a label
	const none = inputPasses(input, {}, ctx, (v) => !allValues.includes(v));
	classes.push({
		kind: 'default',
		label: { kind: 'default' },
		properties: {},
		substitute: none ? undefined : { output: fallback }
	});
	return classes;
}
