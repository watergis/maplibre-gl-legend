import { fieldOf, isOperator, literalValue } from '../classify/accessor';
import { formatValue, formatValues } from './format';

const SYMBOLS: Record<string, string> = {
	'==': '=',
	'!=': '≠',
	'<': '<',
	'<=': '≤',
	'>': '>',
	'>=': '≥'
};
const MIRRORED: Record<string, string> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };

function comparison(op: string, a: unknown, b: unknown): string | undefined {
	const left = fieldOf(a);
	if (left !== undefined && !Array.isArray(literalValue(b))) {
		return `${left} ${SYMBOLS[op]} ${formatValue(literalValue(b))}`;
	}
	const right = fieldOf(b);
	if (right !== undefined && !Array.isArray(literalValue(a))) {
		return `${right} ${SYMBOLS[MIRRORED[op] ?? op]} ${formatValue(literalValue(a))}`;
	}
	return undefined;
}

function joined(parts: unknown[], separator: string): string | undefined {
	const texts = parts.map((part) => describeCondition(part));
	if (texts.length === 0 || texts.some((text) => text === undefined)) return undefined;
	return texts.length === 1 ? texts[0] : texts.map((text) => `(${text})`).join(separator);
}

/**
 * Describe the condition of a `case` as `field = value` and the like. Undefined if it is
 * not one which can be put that way; the class is then labelled `Class n`.
 */
export function describeCondition(condition: unknown): string | undefined {
	const field = fieldOf(condition);
	if (field !== undefined) return field;
	if (!isOperator(condition)) return undefined;

	const [op, ...args] = condition as [string, ...unknown[]];
	if (op in SYMBOLS) return args.length === 2 ? comparison(op, args[0], args[1]) : undefined;
	switch (op) {
		case 'in': {
			const name = fieldOf(args[0]);
			const haystack = literalValue(args[1]);
			if (name === undefined) return undefined;
			if (Array.isArray(haystack)) return `${name} = ${formatValues(haystack)}`;
			return typeof haystack === 'string' ? `${name} in ${haystack}` : undefined;
		}
		case 'has':
			return args.length === 1 && typeof args[0] === 'string' ? `has ${args[0]}` : undefined;
		case '!': {
			const inner = describeCondition(args[0]);
			return inner === undefined ? undefined : `not (${inner})`;
		}
		case 'all':
			return joined(args, ' and ');
		case 'any':
			return joined(args, ' or ');
		default:
			return undefined;
	}
}
