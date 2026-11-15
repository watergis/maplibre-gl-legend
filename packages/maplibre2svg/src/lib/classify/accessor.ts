/** Bindings of `let`, by name, to the expression which `var` stands for */
export type Scope = ReadonlyMap<string, unknown>;

/**
 * Operators which wrap the value of a feature without changing which feature gives which
 * value, so that the representative value can be set on the field as it is.
 */
const WRAPPERS = new Set([
	'to-string',
	'to-number',
	'to-boolean',
	'number',
	'string',
	'boolean',
	'downcase',
	'upcase'
]);

/** Operators which read the feature, apart from `get` and `has` */
const FEATURE_OPERATORS = new Set(['geometry-type', 'id', 'properties']);

export const isOperator = (expr: unknown, op?: string): expr is unknown[] =>
	Array.isArray(expr) && typeof expr[0] === 'string' && (op === undefined || expr[0] === op);

/** Whether the value is a literal: a primitive or `["literal", value]` */
export function isLiteral(expr: unknown) {
	return !Array.isArray(expr) || isOperator(expr, 'literal');
}

/** The value of a literal */
export function literalValue(expr: unknown): unknown {
	return isOperator(expr, 'literal') ? expr[1] : expr;
}

/** Whether a `get` or `has` reads a property of the feature, not of an object */
const readsFeature = (expr: unknown[]) => expr.length === 2;

/**
 * The name of the field which an expression reads, through the wrappers which keep the
 * value as it is, e.g. `["to-string", ["get", "kind"]]` → `kind`. Undefined if the
 * expression is anything else.
 */
export function fieldOf(expr: unknown): string | undefined {
	let node = expr;
	while (isOperator(node) && WRAPPERS.has(node[0] as string)) node = node[1];
	if (isOperator(node, 'get') && readsFeature(node) && typeof node[1] === 'string') {
		return node[1];
	}
	return undefined;
}

const NO_INPUTS: ReadonlySet<string> = new Set();

/**
 * Whether the expression depends on the feature (not only on the zoom or constants), or on one
 * of the further `inputs`, such as `elevation` for `color-relief-color`
 */
export function isFeatureDependent(
	expr: unknown,
	scope: Scope = new Map(),
	inputs: ReadonlySet<string> = NO_INPUTS
): boolean {
	if (!isOperator(expr) || expr[0] === 'literal') return false;
	const op = expr[0] as string;
	if (inputs.has(op)) return true;
	if (op === 'var') return isFeatureDependent(scope.get(expr[1] as string), scope, inputs);
	if ((op === 'get' || op === 'has') && readsFeature(expr)) return true;
	if (FEATURE_OPERATORS.has(op)) return true;
	return expr.slice(1).some((child) => isFeatureDependent(child, scope, inputs));
}

/** Replace `["var", name]` with the expression bound to the name */
export function resolveVars(expr: unknown, scope: Scope): unknown {
	if (!isOperator(expr) || expr[0] === 'literal' || scope.size === 0) return expr;
	if (expr[0] === 'var' && scope.has(expr[1] as string)) return scope.get(expr[1] as string);
	return expr.map((child, i) => (i === 0 ? child : resolveVars(child, scope)));
}

/** Copy of the expression with the node at `path` replaced */
export function replaceAt(expr: unknown, path: readonly number[], value: unknown): unknown {
	if (path.length === 0) return value;
	if (!Array.isArray(expr)) return expr;
	const [head, ...rest] = path;
	return expr.map((child, i) => (i === head ? replaceAt(child, rest, value) : child));
}

/**
 * The fields of the feature which an expression reads with `get` or `has`, such as the input
 * of a `match` or the conditions of a `case`
 */
export function fieldsRead(expr: unknown, found: Set<string> = new Set()): Set<string> {
	if (!isOperator(expr) || expr[0] === 'literal') return found;
	if (
		(expr[0] === 'get' || expr[0] === 'has') &&
		expr.length === 2 &&
		typeof expr[1] === 'string'
	) {
		found.add(expr[1]);
	}
	for (const child of expr.slice(1)) fieldsRead(child, found);
	return found;
}
