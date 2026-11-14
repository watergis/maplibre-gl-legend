import { expression, styleFunction } from '../style-spec';
import type {
	Feature,
	GlobalProperties,
	PropertyValueSpecification,
	StylePropertySpecification
} from 'maplibre-gl';

/** Geometry type of the feature which an expression is evaluated for */
export type GeometryType = 'Point' | 'LineString' | 'Polygon' | 'Unknown';

/** What an expression is evaluated for */
export interface EvaluationInput {
	zoom: number;
	/** properties of the feature, `{}` by default */
	properties?: Record<string, unknown>;
	geometryType?: GeometryType;
	/** further globals, such as `lineProgress` or `heatmapDensity` for color ramps */
	globals?: Omit<GlobalProperties, 'zoom'>;
}

/** The geometry type of the features which a layer type draws */
export function geometryTypeOf(layerType: string): GeometryType {
	switch (layerType) {
		case 'fill':
		case 'fill-extrusion':
			return 'Polygon';
		case 'line':
			return 'LineString';
		case 'circle':
		case 'symbol':
		case 'heatmap':
			return 'Point';
		default:
			return 'Unknown';
	}
}

/**
 * Turn the value of a property into an expression when it is a legacy function
 * (`{stops, property, type, ...}`), so that both go down the same path. Other values are
 * returned as they are.
 */
export function toExpression(value: unknown, spec: StylePropertySpecification): unknown {
	if (styleFunction.isFunction(value)) return styleFunction.convertFunction(value, spec);
	return value;
}

/** Build the feature which the style-spec evaluates expressions for */
export function toFeature(input: EvaluationInput): Feature {
	return {
		type: input.geometryType ?? 'Unknown',
		properties: input.properties ?? {}
	};
}

/**
 * Evaluate the value of a property, a constant, an expression or a legacy function.
 * Throws if the value cannot be parsed or fails to evaluate. Expressions are evaluated
 * without the error handling of the style-spec, which would log a warning on each failure:
 * legends are rebuilt on every move of the map, and failures are expected here, such as
 * a field which the representative feature does not have.
 */
export function evaluateValue(
	value: unknown,
	spec: StylePropertySpecification,
	input: EvaluationInput,
	/** where the value is in the style, e.g. `layers.roads.paint.line-width`; must not be empty */
	rootKey: string
): unknown {
	const compiled = expression.normalizePropertyExpression(
		toExpression(value, spec) as PropertyValueSpecification<unknown>,
		rootKey,
		spec
	);
	const globals = { ...input.globals, zoom: input.zoom };
	if (expression.isZoomExpression(compiled)) {
		return compiled.evaluateWithoutErrorHandling(globals, toFeature(input));
	}
	// a constant: nothing to fail
	return compiled.evaluate(globals, toFeature(input));
}

/**
 * Evaluate a part of an expression on its own, such as the input of a `match` or a condition
 * of a `case`, without the type of a property. Undefined if it does not parse or fails.
 */
export function evaluateExpression(
	expr: unknown,
	input: EvaluationInput
): { value: unknown } | undefined {
	try {
		const parsed = expression.createExpression(expr, 'legend.part');
		if (parsed.result !== 'success') return undefined;
		const value = parsed.value.evaluateWithoutErrorHandling(
			{ ...input.globals, zoom: input.zoom },
			toFeature(input)
		);
		return { value };
	} catch {
		return undefined;
	}
}

/** Whether the value of a property parses: a constant, an expression or a legacy function */
export function isValidValue(value: unknown, spec: StylePropertySpecification): boolean {
	try {
		expression.normalizePropertyExpression(
			toExpression(value, spec) as PropertyValueSpecification<unknown>,
			'legend.check',
			spec
		);
		return true;
	} catch {
		return false;
	}
}
