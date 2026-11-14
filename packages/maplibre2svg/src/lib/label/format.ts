/** Format a value of an expression for a label */
export function formatValue(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') {
		// rounding a huge value would overflow to Infinity
		if (!Number.isFinite(value) || Math.abs(value) >= 1e15) return String(value);
		return String(Math.round(value * 1e6) / 1e6);
	}
	if (typeof value === 'boolean' || value === null) return String(value);
	return JSON.stringify(value) ?? String(value);
}

/** Format a list of values, as the branch of a `match` with several values */
export function formatValues(values: unknown[]): string {
	return values.map(formatValue).join(', ');
}
