import { describe, expect, it } from 'vitest';
import { synthesize } from './synthesize';

describe('synthesize', () => {
	it('handles equality, both ways round and negated', () => {
		expect(synthesize(['==', ['get', 'a'], 'x'])).toEqual({ a: 'x' });
		expect(synthesize(['==', 3, ['get', 'a']])).toEqual({ a: 3 });
		expect(synthesize(['!=', ['get', 'a'], 3])).toEqual({ a: 4 });
		expect(synthesize(['==', ['get', 'a'], 'x'], true)).toEqual({ a: 'x_' });
	});

	it('handles comparisons, with the operands swapped and negated', () => {
		expect(synthesize(['<', ['get', 'n'], 10])).toEqual({ n: 9 });
		expect(synthesize(['>=', ['get', 'n'], 10])).toEqual({ n: 10 });
		expect(synthesize(['<', 10, ['get', 'n']])).toEqual({ n: 11 });
		expect(synthesize(['<', ['get', 'n'], 10], true)).toEqual({ n: 10 });
	});

	it('handles in, has, !, all and any', () => {
		expect(synthesize(['in', ['get', 'a'], ['literal', ['x', 'y']]])).toEqual({ a: 'x' });
		expect(synthesize(['in', ['get', 'a'], ['literal', ['x', 'x_']]], true)).toEqual({
			a: 'x__'
		});
		expect(synthesize(['has', 'a'])).toEqual({ a: true });
		expect(synthesize(['!', ['has', 'a']])).toEqual({ a: undefined });
		expect(synthesize(['all', ['==', ['get', 'a'], 1], ['>', ['get', 'b'], 2]])).toEqual({
			a: 1,
			b: 3
		});
		expect(synthesize(['any', ['==', ['length', 'x'], 1], ['==', ['get', 'b'], 2]])).toEqual({
			b: 2
		});
	});

	it('reads through wrappers and takes a bare field as a boolean', () => {
		expect(synthesize(['==', ['downcase', ['get', 'a']], 'x'])).toEqual({ a: 'x' });
		expect(synthesize(['to-boolean', ['get', 'flag']])).toEqual({ flag: true });
	});

	it('gives undefined for a condition it cannot work out', () => {
		expect(synthesize(['>', ['length', ['get', 'name']], 10])).toBeUndefined();
		expect(synthesize(['==', ['get', 'a'], ['get', 'b']])).toBeUndefined();
		expect(synthesize(['all', ['has', 'a'], ['within', {}]])).toBeUndefined();
	});
});
