import { isFeatureDependent, isOperator, resolveVars, type Scope } from './accessor';
import { activeZoomBranches } from './zoom';

export type ClassifierKind = 'match' | 'case' | 'step' | 'interpolate';

/** A `match`, `case`, `step` or `interpolate` whose input depends on the feature */
export interface ClassifierNode {
	kind: ClassifierKind;
	/** the node as it is in the expression */
	node: unknown[];
	/** the node with the variables of the enclosing `let`s replaced, to evaluate on its own */
	resolved: unknown[];
	/** position of the node in the expression, as indices of the nested arrays */
	path: number[];
}

const INTERPOLATE = new Set(['interpolate', 'interpolate-hcl', 'interpolate-lab']);

/** Index of the input of the operators whose input decides the branch */
export function inputIndex(op: string): number | undefined {
	if (op === 'match' || op === 'step') return 1;
	if (INTERPOLATE.has(op)) return 2;
	return undefined;
}

/**
 * Whether a condition only checks the type of a value, like the ones which legacy
 * functions with a `default` are converted with: `["==", ["typeof", ["get", f]], "number"]`.
 * Such a `case` wraps the real classification rather than being one.
 */
function isTypeGuard(condition: unknown) {
	return (
		isOperator(condition, '==') &&
		condition.length === 3 &&
		(isOperator(condition[1], 'typeof') || isOperator(condition[2], 'typeof'))
	);
}

function caseConditions(node: unknown[]) {
	const conditions: unknown[] = [];
	for (let i = 1; i < node.length - 1; i += 2) conditions.push(node[i]);
	return conditions;
}

function classify(node: unknown[], scope: Scope): ClassifierKind | undefined {
	const op = node[0] as string;
	const index = inputIndex(op);
	if (index !== undefined) {
		if (!isFeatureDependent(node[index], scope)) return undefined;
		return op === 'match' ? 'match' : op === 'step' ? 'step' : 'interpolate';
	}
	if (op === 'case') {
		const dependent = caseConditions(node).filter((c) => isFeatureDependent(c, scope));
		if (dependent.length > 0 && !dependent.every(isTypeGuard)) return 'case';
	}
	return undefined;
}

type Walk = (expr: unknown, path: number[], scope: Scope) => ClassifierNode[];

function walkLet(expr: unknown[], path: number[], scope: Scope, walk: Walk) {
	// ["let", name1, value1, ..., body]: the bindings are visible in the later values and the body
	const inner = new Map(scope);
	for (let i = 1; i < expr.length - 1; i += 2) {
		const found = walk(expr[i + 1], [...path, i + 1], inner);
		if (found.length > 0) return found;
		inner.set(expr[i] as string, resolveVars(expr[i + 1], inner));
	}
	return walk(expr[expr.length - 1], [...path, expr.length - 1], inner);
}

/**
 * Find the `match`, `case`, `step` or `interpolate` whose branch depends on the feature,
 * depth-first. Goes inside `coalesce`, `let` and wrappers such as `to-string`, and into the
 * outputs of a zoom `step` / `interpolate` which are active at the zoom.
 *
 * Gives one node, or two when the zoom lies between two stops of a zoom `interpolate` whose
 * outputs classify the same input the same way, so that the classes of both can be shown.
 * Gives none when nothing depends on the feature.
 */
export function findClassifierNodes(expr: unknown, zoom: number): ClassifierNode[] {
	const walk: Walk = (node, path, scope) => {
		if (!isOperator(node) || node[0] === 'literal') return [];
		const kind = classify(node, scope);
		if (kind) return [{ kind, node, resolved: resolveVars(node, scope) as unknown[], path }];
		if (node[0] === 'let') return walkLet(node, path, scope, walk);

		const zoomBranches = activeZoomBranches(node, zoom);
		if (zoomBranches) {
			const found = zoomBranches.map((branch) => ({
				...branch,
				nodes: walk(node[branch.index], [...path, branch.index], scope)
			}));
			return pickZoomBranch(found);
		}
		// `coalesce`, wrappers and the rest: depth-first over the arguments
		for (let i = 1; i < node.length; i++) {
			const found = walk(node[i], [...path, i], scope);
			if (found.length > 0) return found;
		}
		return [];
	};
	return walk(expr, [], new Map());
}

/** What makes two nodes classify the same way: their kind and their input */
function signature(found: ClassifierNode) {
	const index = inputIndex(found.resolved[0] as string);
	const input = index === undefined ? caseConditions(found.resolved) : found.resolved[index];
	return `${found.kind}:${JSON.stringify(input)}`;
}

/**
 * Of the nodes found in the active outputs of a zoom `step` / `interpolate`: both when they
 * agree on kind and input, else those of the output nearest to the zoom.
 */
function pickZoomBranch(found: { distance: number; nodes: ClassifierNode[] }[]) {
	const withNodes = found.filter((f) => f.nodes.length > 0);
	if (withNodes.length < 2) return withNodes[0]?.nodes ?? [];
	const [a, b] = withNodes;
	if (
		a.nodes.length === 1 &&
		b.nodes.length === 1 &&
		signature(a.nodes[0]) === signature(b.nodes[0])
	) {
		return [...a.nodes, ...b.nodes];
	}
	return b.distance < a.distance ? b.nodes : a.nodes;
}
