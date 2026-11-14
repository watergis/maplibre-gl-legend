import type { PropertyOverrides, PropertyGroup } from '../expression';
import { replaceAt } from './accessor';
import type { ClassifierNode } from './find-node';
import type { ClassCandidate } from './types';

/** The property which a layer is classified by, with its value as an expression */
export interface ClassificationAxis {
	group: PropertyGroup;
	name: string;
	/** the value of the property, with a legacy function converted into an expression */
	expression: unknown;
}

/**
 * Branch substitution, the fallback for a class whose representative feature could not be
 * made: the classifying node is replaced by the output of the branch, so that the property
 * gives the output of the class whatever the feature is. Other properties are evaluated for
 * the feature as usual.
 */
export function substitutionOverrides(
	axis: ClassificationAxis,
	found: ClassifierNode,
	candidate: ClassCandidate
): PropertyOverrides | undefined {
	if (!candidate.substitute) return undefined;
	const value = replaceAt(axis.expression, found.path, candidate.substitute.output);
	return { [axis.group]: { [axis.name]: value } };
}
