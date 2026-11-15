import { describe, expect, it } from 'vitest';
import { rasterColorMatrix, rasterUniforms } from './color-matrix';

type Rgb = [number, number, number];

/** MapLibre's raster.fragment.glsl, step by step, for one color */
function shader(rgb: Rgb, paint: Record<string, unknown>): Rgb {
	const u = rasterUniforms(paint);
	const w = u.spin;
	const dot = (a: Rgb, b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	let v: Rgb = [
		dot(rgb, [w[0], w[1], w[2]]),
		dot(rgb, [w[2], w[0], w[1]]),
		dot(rgb, [w[1], w[2], w[0]])
	];
	const average = (rgb[0] + rgb[1] + rgb[2]) / 3;
	v = v.map((c) => c + (average - c) * u.saturation) as Rgb;
	v = v.map((c) => (c - 0.5) * u.contrast + 0.5) as Rgb;
	v = v.map((c) => u.brightnessLow + (u.brightnessHigh - u.brightnessLow) * c) as Rgb;
	return v.map((c) => Math.min(1, Math.max(0, c))) as Rgb;
}

/** feColorMatrix on one color, then the clamp of the output */
function matrix(rgb: Rgb, values: number[]): Rgb {
	return [0, 1, 2].map((row) => {
		const m = values.slice(row * 5, row * 5 + 5);
		const v = m[0] * rgb[0] + m[1] * rgb[1] + m[2] * rgb[2] + m[3] + m[4];
		return Math.min(1, Math.max(0, v));
	}) as Rgb;
}

const COLORS: Rgb[] = [
	[0, 0, 0],
	[1, 1, 1],
	[1, 0, 0],
	[0, 1, 0],
	[0, 0, 1],
	[0.2, 0.6, 0.9],
	[0.85, 0.4, 0.1],
	[0.5, 0.5, 0.5]
];

const CASES: Record<string, unknown>[] = [
	{ 'raster-hue-rotate': 90 },
	{ 'raster-hue-rotate': -137 },
	{ 'raster-saturation': -1 },
	{ 'raster-saturation': 0.6 },
	{ 'raster-contrast': 0.5 },
	{ 'raster-contrast': -0.7 },
	{ 'raster-brightness-min': 0.2, 'raster-brightness-max': 0.8 },
	{ 'raster-contrast': 0.9, 'raster-brightness-min': 0.2, 'raster-brightness-max': 0.8 },
	{
		'raster-hue-rotate': 200,
		'raster-saturation': -0.4,
		'raster-contrast': 0.3,
		'raster-brightness-min': 0.1,
		'raster-brightness-max': 0.9
	}
];

describe('rasterColorMatrix', () => {
	it('reproduces the shader within 1/255', () => {
		for (const paint of CASES) {
			const values = rasterColorMatrix(paint);
			expect(values, JSON.stringify(paint)).toHaveLength(20);
			for (const color of COLORS) {
				const expected = shader(color, paint);
				const actual = matrix(color, values ?? []);
				for (let c = 0; c < 3; c++) {
					expect(
						Math.abs(actual[c] - expected[c]) * 255,
						`${JSON.stringify(paint)} ${color}`
					).toBeLessThanOrEqual(1);
				}
			}
		}
	});

	it('keeps alpha and is undefined for the identity', () => {
		expect(rasterColorMatrix({ 'raster-saturation': -1 })?.slice(15)).toEqual([0, 0, 0, 1, 0]);
		expect(rasterColorMatrix({})).toBeUndefined();
		expect(
			rasterColorMatrix({
				'raster-hue-rotate': 0,
				'raster-saturation': 0,
				'raster-contrast': 0,
				'raster-brightness-min': 0,
				'raster-brightness-max': 1
			})
		).toBeUndefined();
	});
});
