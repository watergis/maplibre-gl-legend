import { describe, expect, it } from 'vitest';
import { tintSdf } from '../images';
import type { LegendImage } from '../types';
import { resampleInto, sampleDistance } from './sample';
import { sdfThresholds, shadeDistances, type SdfStyle } from './shade';

const style = (overrides: Partial<SdfStyle> = {}): SdfStyle => ({
	color: [1, 0, 0, 1],
	haloColor: [0, 0, 1, 1],
	haloWidth: 0,
	haloBlur: 0,
	scale: 1,
	...overrides
});

const pixel = (out: Uint8ClampedArray, i: number) => [...out.slice(i * 4, i * 4 + 4)];

describe('sdfThresholds', () => {
	it('follows the shader of MapLibre', () => {
		const t = sdfThresholds(style({ haloWidth: 2, haloBlur: 1, scale: 2 }), 1);
		expect(t.fill.buff).toBe(0.75);
		expect(t.fill.gamma).toBeCloseTo(0.105 / 2);
		expect(t.halo.buff).toBeCloseTo((6 - 1) / 8);
		expect(t.halo.gamma).toBeCloseTo((1.19 / 8 + 0.105) / 2);
		expect(sdfThresholds(style(), 2).fill.gamma).toBeCloseTo(0.0525);
	});

	it('scales text by text-size / 24', () => {
		const small = sdfThresholds(style({ haloWidth: 1, scale: 12 / 24 }), 1);
		const large = sdfThresholds(style({ haloWidth: 1, scale: 36 / 24 }), 1);
		expect(small.halo.buff).toBeCloseTo((6 - 2) / 8);
		expect(large.halo.buff).toBeCloseTo((6 - 1 / 1.5) / 8);
		expect(small.fill.gamma).toBeGreaterThan(large.fill.gamma);
	});
});

describe('shadeDistances', () => {
	it('fills inside the cutoff with the color, with a smooth edge', () => {
		const out = shadeDistances(new Float32Array([0, 0.6, 0.75, 1]), style(), 1);
		expect(pixel(out, 0)).toEqual([0, 0, 0, 0]);
		expect(pixel(out, 1)).toEqual([0, 0, 0, 0]);
		expect(pixel(out, 2)[3]).toBeGreaterThan(100);
		expect(pixel(out, 2)[3]).toBeLessThan(155);
		expect(pixel(out, 3)).toEqual([255, 0, 0, 255]);
	});

	it('draws the halo beneath, out to the wider threshold', () => {
		// halo width 2 at scale 1: buff (6 - 2) / 8 = 0.5
		const out = shadeDistances(new Float32Array([0.3, 0.6, 1]), style({ haloWidth: 2 }), 1);
		expect(pixel(out, 0)[3]).toBe(0);
		expect(pixel(out, 1)).toEqual([0, 0, 255, 255]);
		expect(pixel(out, 2)).toEqual([255, 0, 0, 255]);
	});

	it('takes the alpha of the colors', () => {
		const out = shadeDistances(new Float32Array([1]), style({ color: [0, 1, 0, 0.5] }), 1);
		expect(pixel(out, 0)).toEqual([0, 255, 0, 128]);
	});
});

describe('resampling', () => {
	const field = { data: [0, 255], width: 2, height: 1, stride: 1, channel: 0 };

	it('samples bilinearly between pixel centers', () => {
		expect(sampleDistance(field, 0.5, 0.5)).toBe(0);
		expect(sampleDistance(field, 1, 0.5)).toBeCloseTo(0.5);
		expect(sampleDistance(field, 1.5, 0.5)).toBe(1);
	});

	it('keeps the larger distance where fields overlap', () => {
		const out = new Float32Array([0.9, 0, 0, 0]);
		resampleInto(field, out, 4, { left: 0, top: 0, width: 2, height: 1 });
		expect(out[0]).toBeCloseTo(0.9);
		expect([...out.slice(1)]).toEqual([1, 0, 0]);
	});

	it('draws an SDF icon at the display size, sharp when enlarged', () => {
		// a 4px wide ramp, shown 4 times larger: the edge stays about one output pixel wide
		const data = new Uint8ClampedArray(16);
		[0, 128, 224, 255].forEach((d, i) => (data[i * 4 + 3] = d));
		const image: LegendImage = { data, width: 4, height: 1, pixelRatio: 1, sdf: true };
		const out = tintSdf(image, style({ scale: 4 }), { width: 16, height: 4, pixelRatio: 1 });
		const alphas = Array.from({ length: 16 }, (_, x) => out[x * 4 + 3]);
		const partial = alphas.filter((a) => a > 0 && a < 255);
		expect(partial.length).toBeLessThanOrEqual(2);
		expect(alphas[15]).toBe(255);
	});
});
