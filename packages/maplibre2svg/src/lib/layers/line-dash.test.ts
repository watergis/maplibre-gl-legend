import { describe, expect, it } from 'vitest';
import { dashArray, fitDashes } from './line-dash';

describe('dashArray', () => {
	it('multiplies the lengths by the line width', () => {
		expect(dashArray([2, 1], 3)).toEqual([6, 3]);
	});

	it('repeats an odd number of lengths', () => {
		expect(dashArray([2, 1, 1], 2)).toEqual([4, 2, 2, 4, 2, 2]);
		expect(dashArray([3], 1)).toEqual([3, 3]);
	});

	it('keeps zero dashes (dots with round caps) and drops solid or empty arrays', () => {
		expect(dashArray([0, 2], 2)).toEqual([0, 4]);
		expect(dashArray([2, 0], 2)).toBeUndefined();
		expect(dashArray([0, 0], 2)).toBeUndefined();
		expect(dashArray([], 2)).toBeUndefined();
		expect(dashArray(undefined, 2)).toBeUndefined();
		expect(dashArray([-1, 2], 1)).toEqual([0, 2]);
	});
});

describe('fitDashes', () => {
	it('widens the swatch to show two periods', () => {
		expect(fitDashes([12, 8], 30, 80, 0)).toEqual({ width: 40, dashes: [12, 8] });
		expect(fitDashes([2, 2], 30, 80, 0)).toEqual({ width: 30, dashes: [2, 2] });
	});

	it('scales the dashes down when the widest swatch is too narrow', () => {
		const fitted = fitDashes([40, 40], 30, 80, 0);
		expect(fitted.width).toBe(80);
		expect(fitted.dashes).toEqual([20, 20]);
	});
});
