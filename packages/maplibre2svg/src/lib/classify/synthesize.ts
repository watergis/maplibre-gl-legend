import { fieldOf, isOperator, literalValue } from './accessor';
import type { FeatureProperties } from './types';

type Props = FeatureProperties;

/** A value which differs from the given one */
function differentFrom(value: unknown): unknown {
	if (typeof value === 'number') return value + 1;
	if (typeof value === 'boolean') return !value;
	if (typeof value === 'string') return `${value}_`;
	return 0;
}

/** A value which is in none of the given ones */
function outside(values: unknown[]): unknown {
	let candidate: unknown = values[0] ?? 0;
	for (let i = 0; i < values.length + 1 && values.includes(candidate); i++) {
		candidate = differentFrom(candidate);
	}
	return candidate;
}

/** Split `[op, a, b]` into the field one side reads and the literal on the other side */
function fieldAndLiteral(expr: unknown[]) {
	const [, a, b] = expr;
	if (expr.length !== 3) return undefined;
	const left = fieldOf(a);
	if (left !== undefined && !Array.isArray(literalValue(b))) {
		return { field: left, value: literalValue(b), swapped: false };
	}
	const right = fieldOf(b);
	if (right !== undefined && !Array.isArray(literalValue(a))) {
		return { field: right, value: literalValue(a), swapped: true };
	}
	return undefined;
}

const SWAPPED: Record<string, string> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };
const NEGATED: Record<string, string> = { '<': '>=', '<=': '>', '>': '<=', '>=': '<' };

function compare(op: string, value: unknown): unknown {
	if (typeof value === 'number') {
		if (op === '<') return value - 1;
		if (op === '>') return value + 1;
		return value;
	}
	if (typeof value === 'string') {
		if (op === '<') return '';
		if (op === '>') return `${value}~`;
		return value;
	}
	return undefined;
}

function equality(expr: unknown[], equal: boolean): Props | undefined {
	const pair = fieldAndLiteral(expr);
	if (!pair) return undefined;
	return { [pair.field]: equal ? pair.value : differentFrom(pair.value) };
}

function comparison(expr: unknown[], negate: boolean): Props | undefined {
	const pair = fieldAndLiteral(expr);
	if (!pair) return undefined;
	let op = expr[0] as string;
	if (pair.swapped) op = SWAPPED[op];
	if (negate) op = NEGATED[op];
	const value = compare(op, pair.value);
	return value === undefined ? undefined : { [pair.field]: value };
}

function membership(expr: unknown[], negate: boolean): Props | undefined {
	const field = fieldOf(expr[1]);
	const haystack = literalValue(expr[2]);
	if (field === undefined) return undefined;
	if (Array.isArray(haystack)) {
		if (haystack.length === 0) return negate ? { [field]: 0 } : undefined;
		return { [field]: negate ? outside(haystack) : haystack[0] };
	}
	// a substring of a string: the whole string is one, a longer one is not
	if (typeof haystack === 'string') return { [field]: negate ? `${haystack}_` : haystack };
	return undefined;
}

function merge(parts: (Props | undefined)[]): Props | undefined {
	if (parts.some((part) => part === undefined)) return undefined;
	return Object.assign({}, ...parts);
}

const first = (parts: (Props | undefined)[]) => parts.find((part) => part !== undefined);

/**
 * Make feature properties for which the condition of a `case` holds, or does not hold when
 * `negate` is set. Undefined when the condition is not one that can be worked out; the
 * caller still has to check the result by evaluating the condition.
 */
export function synthesize(condition: unknown, negate = false): Props | undefined {
	if (typeof condition === 'boolean') return condition !== negate ? {} : undefined;
	const field = fieldOf(condition);
	if (field !== undefined) return { [field]: !negate };
	if (!isOperator(condition)) return undefined;

	const args = condition.slice(1);
	switch (condition[0]) {
		case '==':
			return equality(condition, !negate);
		case '!=':
			return equality(condition, negate);
		case '<':
		case '<=':
		case '>':
		case '>=':
			return comparison(condition, negate);
		case 'in':
			return membership(condition, negate);
		case 'has':
			if (condition.length !== 2 || typeof condition[1] !== 'string') return undefined;
			return { [condition[1]]: negate ? undefined : true };
		case '!':
			return synthesize(condition[1], !negate);
		case 'all':
			return negate
				? first(args.map((c) => synthesize(c, true)))
				: merge(args.map((c) => synthesize(c)));
		case 'any':
			return negate
				? merge(args.map((c) => synthesize(c, true)))
				: first(args.map((c) => synthesize(c)));
		default:
			return undefined;
	}
}
