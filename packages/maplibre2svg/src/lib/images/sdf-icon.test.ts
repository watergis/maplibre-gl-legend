import { describe, expect, it } from 'vitest';
import type { LegendImage } from '../types';
import { sdfThresholds, tintSdf, type SdfTint } from './sdf-icon';

/** A 1-pixel-high SDF image whose alpha holds the distances given (0..1) */
const sdfRow = (distances: number[], pixelRatio = 1): LegendImage => {
	const data = new Uint8ClampedArray(distances.length * 4);
	distances.forEach((d, i) => (data[i * 4 + 3] = Math.round(d * 255)));
	return { data, width: distances.length, height: 1, pixelRatio, sdf: true };
};

const tint = (overrides: Partial<SdfTint> = {}): SdfTint => ({
	color: [1, 0, 0, 1],
	haloColor: [0, 0, 1, 1],
	haloWidth: 0,
	haloBlur: 0,
	size: 1,
	...overrides
});

const pixel = (out: Uint8ClampedArray, i: number) => [...out.slice(i * 4, i * 4 + 4)];

describe('sdfThresholds', () => {
	it('follows the shader of MapLibre', () => {
		const t = sdfThresholds(tint({ haloWidth: 2, haloBlur: 1, size: 2 }), 1);
		expect(t.fill.buff).toBe(0.75);
		expect(t.fill.gamma).toBeCloseTo(0.105 / 2);
		expect(t.halo.buff).toBeCloseTo((6 - 1) / 8);
		expect(t.halo.gamma).toBeCloseTo((1.19 / 8 + 0.105) / 2);
		expect(sdfThresholds(tint(), 2).fill.gamma).toBeCloseTo(0.0525);
	});
});

describe('tintSdf', () => {
	it('fills inside the cutoff with the color, with a smooth edge', () => {
		const out = tintSdf(sdfRow([0, 0.6, 0.75, 1]), tint());
		expect(pixel(out, 0)).toEqual([0, 0, 0, 0]);
		expect(pixel(out, 1)).toEqual([0, 0, 0, 0]);
		expect(pixel(out, 2)[3]).toBeGreaterThan(100);
		expect(pixel(out, 2)[3]).toBeLessThan(155);
		expect(pixel(out, 3)).toEqual([255, 0, 0, 255]);
	});

	it('draws the halo beneath, out to the wider threshold', () => {
		// halo width 2 at size 1: buff (6 - 2) / 8 = 0.5
		const out = tintSdf(sdfRow([0.3, 0.6, 1]), tint({ haloWidth: 2 }));
		expect(pixel(out, 0)[3]).toBe(0);
		expect(pixel(out, 1)).toEqual([0, 0, 255, 255]);
		expect(pixel(out, 2)).toEqual([255, 0, 0, 255]);
	});

	it('takes the alpha of the colors', () => {
		const out = tintSdf(sdfRow([1]), tint({ color: [0, 1, 0, 0.5] }));
		expect(pixel(out, 0)).toEqual([0, 255, 0, 128]);
	});
});
