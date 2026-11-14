import type { LayerSpecification } from 'maplibre-gl';
import { hasSpecType } from './check';
import { evaluateValue, geometryTypeOf, type EvaluationInput, type GeometryType } from './evaluate';
import { toPlain } from './plain';
import {
	isColorRamp,
	propertySpec,
	propertySpecs,
	type PropertyGroup,
	type StylePropertySpecification
} from './spec';
import { isTokenString, resolveTokens, type UnresolvedTokens } from './tokens';

/** Values which replace the properties of a layer, by group and name */
export type PropertyOverrides = Partial<Record<PropertyGroup, Record<string, unknown>>>;

/**
 * A layer whose paint and layout properties hold plain values, evaluated for one
 * representative feature at one zoom, in place of the expressions of the style.
 */
export interface EvaluatedLayer {
	id: string;
	type: string;
	paint: Record<string, unknown>;
	layout: Record<string, unknown>;
	/** the zoom which the properties were evaluated at */
	zoom: number;
	/** properties of the representative feature */
	properties: Record<string, unknown>;
	/**
	 * Properties given as `{token}` strings whose fields the representative feature does not
	 * have, by name, e.g. `{ 'icon-image': { template: 'mark_{kind}', fields: ['kind'] } }`.
	 * The value in `layout` has those tokens as empty strings; a renderer can use the template
	 * to pick a sample instead.
	 */
	unresolvedTokens: Record<string, UnresolvedTokens>;
	/**
	 * The layer as it is in the style. Renderers read it for what has no single value, such
	 * as the color ramps, which are left out of `paint`.
	 */
	original: LayerSpecification;
}

export interface EvaluateLayerOptions {
	zoom: number;
	properties?: Record<string, unknown>;
	/** values to use in place of the ones of the layer */
	overrides?: PropertyOverrides;
	/** geometry type of the feature, when the filter of the layer tells it; else by layer type */
	geometryType?: GeometryType;
}

function rawValue(layer: LayerSpecification, group: PropertyGroup, name: string) {
	const bag = (layer as { paint?: Record<string, unknown>; layout?: Record<string, unknown> })[
		group
	];
	return bag?.[name];
}

/** Evaluate the default of the specification, so that it has the same form as other values */
function defaultValue(spec: StylePropertySpecification, input: EvaluationInput, rootKey: string) {
	if (spec.default === undefined) return undefined;
	try {
		return toPlain(evaluateValue(spec.default, spec, input, rootKey));
	} catch {
		// never seen with the reference, but a default is not worth breaking the legend for
		return undefined;
	}
}

/**
 * Evaluate one property of a layer, as a plain value. A property which is not set, or which
 * fails to parse or to evaluate, gives the default of the specification.
 */
export function evaluateProperty(
	layer: LayerSpecification,
	group: PropertyGroup,
	name: string,
	input: EvaluationInput,
	override?: unknown
): unknown {
	const spec = propertySpec(layer.type, group, name);
	if (!spec) return undefined;
	const full: EvaluationInput = {
		...input,
		geometryType: input.geometryType ?? geometryTypeOf(layer.type)
	};
	const rootKey = `layers.${layer.id}.${group}.${name}`;
	let value = override !== undefined ? override : rawValue(layer, group, name);
	if (isTokenString(value, spec)) value = resolveTokens(value, input.properties ?? {}).text;
	if (value === undefined) return defaultValue(spec, full, rootKey);
	try {
		const result = evaluateValue(value, spec, full, rootKey);
		return hasSpecType(result, spec) ? toPlain(result) : defaultValue(spec, full, rootKey);
	} catch {
		return defaultValue(spec, full, rootKey);
	}
}

function evaluateGroup(
	layer: LayerSpecification,
	group: PropertyGroup,
	options: EvaluateLayerOptions,
	unresolved: Record<string, UnresolvedTokens>
): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	const properties = options.properties ?? {};
	const input = { zoom: options.zoom, properties, geometryType: options.geometryType };
	for (const [name, spec] of Object.entries(propertySpecs(layer.type, group))) {
		const override = options.overrides?.[group]?.[name];
		// a ramp has no single value, unless a class substitutes one branch of it for the node
		if (isColorRamp(spec) && override === undefined) continue;
		const raw = override !== undefined ? override : rawValue(layer, group, name);
		if (isTokenString(raw, spec)) {
			const { missing, partial } = resolveTokens(raw, properties);
			if (missing.length > 0) unresolved[name] = { template: partial, fields: missing };
		}
		const value = evaluateProperty(layer, group, name, input, override);
		if (value !== undefined) values[name] = value;
	}
	return values;
}

/**
 * Evaluate every paint and layout property of a layer for one feature at one zoom.
 * Never throws because of a property: a broken one gives the default of the specification.
 */
export function evaluateLayer(
	layer: LayerSpecification,
	options: EvaluateLayerOptions
): EvaluatedLayer {
	const unresolvedTokens: Record<string, UnresolvedTokens> = {};
	return {
		id: layer.id,
		type: layer.type,
		paint: evaluateGroup(layer, 'paint', options, unresolvedTokens),
		layout: evaluateGroup(layer, 'layout', options, unresolvedTokens),
		zoom: options.zoom,
		properties: options.properties ?? {},
		unresolvedTokens,
		original: layer
	};
}
