import { describe, expect, it } from 'vitest';
import { dashPattern, fitDashes } from './line-dash';

describe('dashPattern', () => {
	it('multiplies the lengths by the line width', () => {
		expect(dashPattern([2, 1], 3)).toEqual({ dashes: [6, 3], offset: 0 });
	});

	it('joins the last length of an odd array to the first, as MapLibre does', () => {
		// dash 1, gap 1, dash 4 which runs into the next dash 1: dash 5, gap 1, from 4 in
		expect(dashPattern([1, 1, 4], 2)).toEqual({ dashes: [10, 2], offset: 8 });
		expect(dashPattern([3], 1)).toBeUndefined();
	});

	it('keeps zero dashes (dots with round caps) and drops solid or empty arrays', () => {
		expect(dashPattern([0, 2], 2)).toEqual({ dashes: [0, 4], offset: 0 });
		expect(dashPattern([2, 0], 2)).toBeUndefined();
		expect(dashPattern([0, 0], 2)).toBeUndefined();
		expect(dashPattern([], 2)).toBeUndefined();
		expect(dashPattern(undefined, 2)).toBeUndefined();
		expect(dashPattern([-1, 2], 1)).toEqual({ dashes: [0, 2], offset: 0 });
		expect(dashPattern([Number.NaN, 2], 1)).toEqual({ dashes: [0, 2], offset: 0 });
	});
});

describe('fitDashes', () => {
	it('widens the swatch to show two periods', () => {
		expect(fitDashes({ dashes: [12, 8], offset: 0 }, 30, 80, 0).width).toBe(40);
		expect(fitDashes({ dashes: [2, 2], offset: 0 }, 30, 80, 0).width).toBe(30);
	});

	it('scales the dashes and the offset down when the widest swatch is too narrow', () => {
		const fitted = fitDashes({ dashes: [40, 40], offset: 10 }, 30, 80, 0);
		expect(fitted.width).toBe(80);
		expect(fitted.pattern).toEqual({ dashes: [20, 20], offset: 5 });
	});
});
