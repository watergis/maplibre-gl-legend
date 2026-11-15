import type { ClassifierNode } from './find-node';
import { propertiesFor } from './match';
import type { ClassCandidate } from './types';
import { inputPasses, type ClassifyContext } from './verify';

/**
 * Classes of `["interpolate", type, input, stop1, output1, ...]`: one per stop, whose
 * representative is the stop value.
 */
export function interpolateClasses(found: ClassifierNode, ctx: ClassifyContext): ClassCandidate[] {
	const node = found.resolved;
	const input = node[2];
	const classes: ClassCandidate[] = [];
	for (let i = 3; i < node.length - 1; i += 2) {
		const stop = node[i];
		const properties = propertiesFor(input, stop);
		const ok = inputPasses(
			input,
			properties,
			ctx,
			(v) => typeof v === 'number' && Math.abs(v - Number(stop)) < 1e-9
		);
		classes.push({
			kind: 'stop',
			label: { kind: 'stop', value: stop },
			properties: ok && properties ? properties : {},
			substitute: ok ? undefined : { output: found.node[i + 1] }
		});
	}
	return classes;
}
