import { evaluateExpression, type GeometryType } from '../expression';
import type { FeatureProperties } from './types';

/** What a classifying node is evaluated for */
export interface ClassifyContext {
	zoom: number;
	geometryType: GeometryType;
}

/** Drop the fields marked as absent */
export function cleanProperties(properties: FeatureProperties): FeatureProperties {
	return Object.fromEntries(Object.entries(properties).filter(([, v]) => v !== undefined));
}

/**
 * Evaluate a part of an expression, such as the input of a `match` or a condition of a
 * `case`, for a feature. Undefined if it does not parse or fails to evaluate.
 */
export function evaluatePart(
	expr: unknown,
	properties: FeatureProperties,
	ctx: ClassifyContext
): { value: unknown } | undefined {
	return evaluateExpression(expr, {
		zoom: ctx.zoom,
		properties: cleanProperties(properties),
		geometryType: ctx.geometryType
	});
}

/** Whether the input of a node evaluates, for the properties, to a value which passes `test` */
export function inputPasses(
	input: unknown,
	properties: FeatureProperties | undefined,
	ctx: ClassifyContext,
	test: (value: unknown) => boolean
) {
	if (!properties) return false;
	const result = evaluatePart(input, properties, ctx);
	return result !== undefined && test(result.value);
}
