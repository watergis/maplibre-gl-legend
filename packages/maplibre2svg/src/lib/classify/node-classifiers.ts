import { caseClasses } from './case';
import type { ClassifierKind, ClassifierNode } from './find-node';
import { interpolateClasses } from './interpolate';
import { matchClasses } from './match';
import { stepClasses } from './step';
import type { ClassCandidate } from './types';
import type { ClassifyContext } from './verify';

/**
 * Splits one kind of classifying node into the classes of the legend, each with the
 * properties of a representative feature (or the output to substitute for the node when no
 * such feature can be made)
 */
export interface NodeClassifier {
	readonly kind: ClassifierKind;
	classify(found: ClassifierNode, ctx: ClassifyContext): ClassCandidate[];
}

/** `match`: one class per branch, represented by its first value, and the fallback */
export class MatchClassifier implements NodeClassifier {
	readonly kind = 'match';
	classify(found: ClassifierNode, ctx: ClassifyContext) {
		return matchClasses(found, ctx);
	}
}

/** `case`: one class per condition, with properties worked out to make it hold, and the fallback */
export class CaseClassifier implements NodeClassifier {
	readonly kind = 'case';
	classify(found: ClassifierNode, ctx: ClassifyContext) {
		return caseClasses(found, ctx);
	}
}

/** `step`: one class per interval, represented by its midpoint */
export class StepClassifier implements NodeClassifier {
	readonly kind = 'step';
	classify(found: ClassifierNode, ctx: ClassifyContext) {
		return stepClasses(found, ctx);
	}
}

/** `interpolate`: one class per stop, represented by the stop value */
export class InterpolateClassifier implements NodeClassifier {
	readonly kind = 'interpolate';
	classify(found: ClassifierNode, ctx: ClassifyContext) {
		return interpolateClasses(found, ctx);
	}
}

/** The classifiers of every kind of node, by kind */
export type NodeClassifiers = Record<ClassifierKind, NodeClassifier>;

/** The built-in classifiers */
export function defaultNodeClassifiers(): NodeClassifiers {
	return {
		match: new MatchClassifier(),
		case: new CaseClassifier(),
		step: new StepClassifier(),
		interpolate: new InterpolateClassifier()
	};
}
