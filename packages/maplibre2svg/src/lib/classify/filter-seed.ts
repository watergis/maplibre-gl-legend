import type { GeometryType } from '../style';
import { isOperator, literalValue } from './accessor';
import type { FeatureProperties } from './types';

/** What the filter of a layer says for certain about the features it draws */
export interface FilterSeed {
	properties: FeatureProperties;
	geometryType?: GeometryType;
}

const GEOMETRY: Record<string, GeometryType> = {
	Point: 'Point',
	MultiPoint: 'Point',
	LineString: 'LineString',
	MultiLineString: 'LineString',
	Polygon: 'Polygon',
	MultiPolygon: 'Polygon'
};

const isScalar = (value: unknown) =>
	typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

/** Type assertions, which keep the value as it is when it has their type */
const ASSERTIONS: Record<string, string> = {
	number: 'number',
	string: 'string',
	boolean: 'boolean'
};

/**
 * The field which an expression reads when the value compared to it is certainly the value of
 * the field, with its type: a plain `get`, or a type assertion of the value's type around it.
 * Conversions (`to-string`, `to-number`, `downcase`, …) leave the field's own value unknown.
 */
function certainField(expr: unknown, value: unknown): string | undefined {
	if (isOperator(expr, 'get') && expr.length === 2 && typeof expr[1] === 'string') return expr[1];
	if (isOperator(expr) && ASSERTIONS[expr[0] as string] === typeof value) {
		return certainField(expr[1], value);
	}
	return undefined;
}

/** Legacy filter keys which are not properties: the id and the geometry type */
const LEGACY_SPECIAL = new Set(['$id', '$type']);

/** Record that the field has the value; `$type` and `geometry-type` set the geometry */
function set(seed: FilterSeed, field: string | undefined, value: unknown, geometry: boolean) {
	if (!isScalar(value)) return;
	if (geometry) {
		const type = GEOMETRY[String(value)];
		if (type) seed.geometryType = type;
		return;
	}
	if (field !== undefined) seed.properties[field] = value;
}

/** `["==", a, b]`, legacy (`["==", "class", "railway"]`) or expression (`["==", ["get", "class"], …]`) */
function equality(seed: FilterSeed, [, a, b]: unknown[]) {
	if (typeof a === 'string' && !Array.isArray(b)) {
		if (a === '$type') set(seed, undefined, b, true);
		else if (!LEGACY_SPECIAL.has(a)) set(seed, a, b, false);
		return;
	}
	for (const [side, other] of [
		[a, b],
		[b, a]
	]) {
		if (isOperator(side, 'geometry-type')) return set(seed, undefined, literalValue(other), true);
		const value = literalValue(other);
		const field = certainField(side, value);
		if (field !== undefined && !Array.isArray(value)) return set(seed, field, value, false);
	}
}

/** `["in", …]`: legacy `["in", "class", "a", "b"]` or expression `["in", ["get", "class"], ["literal", […]]]` */
function membership(seed: FilterSeed, filter: unknown[]) {
	const [, needle, ...rest] = filter;
	if (typeof needle === 'string') {
		if (needle === '$type') set(seed, undefined, rest[0], true);
		else if (!LEGACY_SPECIAL.has(needle)) set(seed, needle, rest[0], false);
		return;
	}
	const haystack = literalValue(rest[0]);
	if (!Array.isArray(haystack)) return;
	if (isOperator(needle, 'geometry-type')) return set(seed, undefined, haystack[0], true);
	set(seed, certainField(needle, haystack[0]), haystack[0], false);
}

/** `["match", input, labels, true, …, false]`: the first label whose output is `true` */
function matchMembership(seed: FilterSeed, filter: unknown[]) {
	for (let i = 2; i < filter.length - 1; i += 2) {
		if (filter[i + 1] !== true) continue;
		const value = Array.isArray(filter[i]) ? (filter[i] as unknown[])[0] : filter[i];
		if (isOperator(filter[1], 'geometry-type')) return set(seed, undefined, value, true);
		return set(seed, certainField(filter[1], value), value, false);
	}
}

function walk(seed: FilterSeed, filter: unknown) {
	if (!isOperator(filter)) return;
	switch (filter[0]) {
		case 'all':
			for (const part of filter.slice(1)) walk(seed, part);
			return;
		case '==':
			if (filter.length === 3) equality(seed, filter);
			return;
		case 'in':
			if (filter.length >= 3) membership(seed, filter);
			return;
		case 'match':
			matchMembership(seed, filter);
			return;
		default:
			// `any`, negations, comparisons and the rest say nothing certain
			return;
	}
}

/**
 * The properties (and geometry type) which every feature of the layer has for certain,
 * according to its `filter`: equalities, and the first value of an `in` or of a `match`
 * membership, combined through `all`, in both legacy and expression forms. They are the base of
 * the representative features, so that `{token}` names and expressions see what the layer
 * really draws.
 */
export function seedFromFilter(filter: unknown): FilterSeed {
	const seed: FilterSeed = { properties: {} };
	try {
		walk(seed, filter);
	} catch {
		// a filter of an unexpected shape says nothing
	}
	return seed;
}
