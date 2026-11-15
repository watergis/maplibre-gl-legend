/**
 * Read the outputs of a property value which the editor can change one by one: a constant, a
 * legacy function with `stops`, or an `interpolate` / `step` / `match` expression whose outputs
 * are constants. Other expressions are only editable in the manual editor.
 */

/** an output of a value, with a label telling when it applies (e.g. `zoom 10`) */
export interface Stop<T> {
	label: string;
	value: T;
}

/** a value whose outputs can be changed one by one */
export type EditableValue<T> =
	| { kind: 'constant'; value: T }
	| {
			kind: 'stops';
			stops: Stop<T>[];
			/**
			 * the property value with the outputs replaced, in the order of `stops`
			 * @param values new outputs, written as returned by `format`
			 */
			update: (values: unknown[]) => unknown;
	  }
	| { kind: 'expression' };

/** a readable name of the input of an expression, e.g. `zoom` or the name of a feature property */
export function inputLabel(input: unknown): string {
	if (Array.isArray(input)) {
		if (input[0] === 'get' && typeof input[1] === 'string') return input[1];
		if (input.length === 1 && typeof input[0] === 'string') return input[0].replace(/-/g, ' ');
	}
	return 'value';
}

const labelOf = (value: unknown): string =>
	Array.isArray(value)
		? value.join(', ')
		: typeof value === 'string'
			? value
			: JSON.stringify(value);

/**
 * Find the outputs of a property value.
 *
 * @param value the value of the property, as returned by `map.getPaintProperty()`
 * @param parse parse an output; `undefined` when it is not a constant the editor can change
 * @returns how the value can be edited
 */
export function toEditable<T>(
	value: unknown,
	parse: (v: unknown) => T | undefined
): EditableValue<T> {
	const constant = parse(value);
	if (constant !== undefined) return { kind: 'constant', value: constant };

	// legacy function: { property?, base?, stops: [[input, output], ...] }
	if (value && typeof value === 'object' && !Array.isArray(value) && 'stops' in value) {
		const fn = value as { property?: string; stops: [unknown, unknown][] };
		if (!Array.isArray(fn.stops)) return { kind: 'expression' };
		const outputs = fn.stops.map((stop) => parse(stop[1]));
		if (outputs.some((o) => o === undefined)) return { kind: 'expression' };
		const name = fn.property ?? 'zoom';
		return {
			kind: 'stops',
			stops: fn.stops.map((stop, i) => ({
				label: `${name} ${labelOf(stop[0])}`,
				value: outputs[i] as T
			})),
			update: (values) => ({
				...fn,
				stops: fn.stops.map((stop, i) => [stop[0], values[i]])
			})
		};
	}

	if (!Array.isArray(value)) return { kind: 'expression' };
	const [operator] = value;

	// positions of the outputs in the expression, and their labels
	const positions: number[] = [];
	const labels: string[] = [];
	if (
		operator === 'interpolate' ||
		operator === 'interpolate-hcl' ||
		operator === 'interpolate-lab'
	) {
		const name = inputLabel(value[2]);
		for (let i = 3; i + 1 < value.length; i += 2) {
			positions.push(i + 1);
			labels.push(`${name} ${labelOf(value[i])}`);
		}
	} else if (operator === 'step') {
		const name = inputLabel(value[1]);
		positions.push(2);
		labels.push(`${name} < ${labelOf(value[3])}`);
		for (let i = 3; i + 1 < value.length; i += 2) {
			positions.push(i + 1);
			labels.push(`${name} ≥ ${labelOf(value[i])}`);
		}
	} else if (operator === 'match') {
		const name = inputLabel(value[1]);
		for (let i = 2; i + 1 < value.length; i += 2) {
			positions.push(i + 1);
			labels.push(`${name} = ${labelOf(value[i])}`);
		}
		positions.push(value.length - 1);
		labels.push('other');
	} else {
		return { kind: 'expression' };
	}

	const outputs = positions.map((p) => parse(value[p]));
	if (positions.length === 0 || outputs.some((o) => o === undefined)) return { kind: 'expression' };
	return {
		kind: 'stops',
		stops: outputs.map((o, i) => ({ label: labels[i], value: o as T })),
		update: (values) => {
			const next = [...value];
			positions.forEach((p, i) => (next[p] = values[i]));
			return next;
		}
	};
}
