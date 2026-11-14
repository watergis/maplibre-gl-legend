import type { GeometryType } from '../expression';
import { fieldOf, isOperator, literalValue } from './accessor';
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
		set(seed, a, b, a === '$type');
		return;
	}
	for (const [side, other] of [
		[a, b],
		[b, a]
	]) {
		if (isOperator(side, 'geometry-type')) return set(seed, undefined, literalValue(other), true);
		const field = fieldOf(side);
		if (field !== undefined && !Array.isArray(literalValue(other))) {
			return set(seed, field, literalValue(other), false);
		}
	}
}

/** `["in", …]`: legacy `["in", "class", "a", "b"]` or expression `["in", ["get", "class"], ["literal", […]]]` */
function membership(seed: FilterSeed, filter: unknown[]) {
	const [, needle, ...rest] = filter;
	if (typeof needle === 'string') {
		set(seed, needle, rest[0], needle === '$type');
		return;
	}
	const haystack = literalValue(rest[0]);
	if (!Array.isArray(haystack)) return;
	if (isOperator(needle, 'geometry-type')) return set(seed, undefined, haystack[0], true);
	set(seed, fieldOf(needle), haystack[0], false);
}

/** `["match", input, labels, true, …, false]`: the first label whose output is `true` */
function matchMembership(seed: FilterSeed, filter: unknown[]) {
	for (let i = 2; i < filter.length - 1; i += 2) {
		if (filter[i + 1] !== true) continue;
		const value = Array.isArray(filter[i]) ? (filter[i] as unknown[])[0] : filter[i];
		if (isOperator(filter[1], 'geometry-type')) return set(seed, undefined, value, true);
		return set(seed, fieldOf(filter[1]), value, false);
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
