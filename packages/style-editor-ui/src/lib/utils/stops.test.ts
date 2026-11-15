import { describe, expect, it } from 'vitest';
import { inputLabel, toEditable } from './stops';

const num = (v: unknown) => (typeof v === 'number' ? v : undefined);

describe('toEditable', () => {
	it('reads a constant', () => {
		expect(toEditable(3, num)).toEqual({ kind: 'constant', value: 3 });
	});

	it('reads and updates an interpolate expression', () => {
		const value = ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4];
		const editable = toEditable(value, num);
		if (editable.kind !== 'stops') throw new Error(editable.kind);
		expect(editable.stops).toEqual([
			{ label: 'zoom 10', value: 1 },
			{ label: 'zoom 16', value: 4 }
		]);
		expect(editable.update([2, 8])).toEqual(['interpolate', ['linear'], ['zoom'], 10, 2, 16, 8]);
		// the original value is not changed
		expect(value[4]).toBe(1);
	});

	it('reads a step expression', () => {
		const editable = toEditable(['step', ['zoom'], 1, 12, 2], num);
		if (editable.kind !== 'stops') throw new Error(editable.kind);
		expect(editable.stops.map((s) => s.label)).toEqual(['zoom < 12', 'zoom ≥ 12']);
		expect(editable.update([5, 6])).toEqual(['step', ['zoom'], 5, 12, 6]);
	});

	it('reads a match expression with its fallback', () => {
		const editable = toEditable(['match', ['get', 'class'], ['a', 'b'], 1, 'c', 2, 3], num);
		if (editable.kind !== 'stops') throw new Error(editable.kind);
		expect(editable.stops).toEqual([
			{ label: 'class = a, b', value: 1 },
			{ label: 'class = c', value: 2 },
			{ label: 'other', value: 3 }
		]);
	});

	it('reads and updates a legacy function', () => {
		const value = {
			base: 1.5,
			stops: [
				[5, 1],
				[10, 3]
			]
		};
		const editable = toEditable(value, num);
		if (editable.kind !== 'stops') throw new Error(editable.kind);
		expect(editable.stops[1]).toEqual({ label: 'zoom 10', value: 3 });
		expect(editable.update([2, 4])).toEqual({
			base: 1.5,
			stops: [
				[5, 2],
				[10, 4]
			]
		});
	});

	it('does not edit expressions with computed outputs', () => {
		expect(toEditable(['interpolate', ['linear'], ['zoom'], 10, ['get', 'w'], 16, 4], num)).toEqual(
			{
				kind: 'expression'
			}
		);
		expect(toEditable(['case', true, 1, 2], num)).toEqual({ kind: 'expression' });
	});
});

describe('inputLabel', () => {
	it('names the input', () => {
		expect(inputLabel(['get', 'class'])).toBe('class');
		expect(inputLabel(['heatmap-density'])).toBe('heatmap density');
		expect(inputLabel(['+', 1, 2])).toBe('value');
	});
});
