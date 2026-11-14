import { numberOf } from '../layers/common';

/** The uniforms of MapLibre's raster shader (`raster_program.ts`), from the paint properties */
export interface RasterUniforms {
	spin: [number, number, number];
	saturation: number;
	contrast: number;
	brightnessLow: number;
	brightnessHigh: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** `spinWeights`, `saturationFactor` and `contrastFactor` of MapLibre 6.16 */
export function rasterUniforms(paint: Record<string, unknown>): RasterUniforms {
	const angle = (numberOf(paint['raster-hue-rotate'], 0) * Math.PI) / 180;
	const [s, c] = [Math.sin(angle), Math.cos(angle)];
	const saturation = clamp(numberOf(paint['raster-saturation'], 0), -1, 1);
	const contrast = clamp(numberOf(paint['raster-contrast'], 0), -1, 1);
	return {
		spin: [(2 * c + 1) / 3, (-Math.sqrt(3) * s - c + 1) / 3, (Math.sqrt(3) * s - c + 1) / 3],
		saturation: saturation > 0 ? 1 - 1 / (1.001 - saturation) : -saturation,
		contrast: contrast > 0 ? 1 / (1 - Math.min(contrast, 0.999)) : 1 + contrast,
		brightnessLow: clamp(numberOf(paint['raster-brightness-min'], 0), 0, 1),
		brightnessHigh: clamp(numberOf(paint['raster-brightness-max'], 1), 0, 1)
	};
}

/**
 * The 4 × 5 `feColorMatrix` of the shader's color steps, which are all linear before the final
 * clamp: spin `S` (rows `w`, `w.zxy`, `w.yzx`), saturation `(1 − f) I + f/3 · J` (towards the
 * average, which the spin keeps), contrast `k (v − ½) + ½`, brightness `lo + (hi − lo) v`. So
 * `rgb' = (hi − lo) k ((1 − f) S + f/3 J) rgb + (hi − lo)(1 − k)/2 + lo`; alpha is kept.
 * Undefined for the identity.
 */
export function rasterColorMatrix(paint: Record<string, unknown>): number[] | undefined {
	const u = rasterUniforms(paint);
	const [w0, w1, w2] = u.spin;
	const spin = [
		[w0, w1, w2],
		[w2, w0, w1],
		[w1, w2, w0]
	];
	const scale = (u.brightnessHigh - u.brightnessLow) * u.contrast;
	const offset = (u.brightnessHigh - u.brightnessLow) * 0.5 * (1 - u.contrast) + u.brightnessLow;
	const values: number[] = [];
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 3; col++) {
			values.push(scale * ((1 - u.saturation) * spin[row][col] + u.saturation / 3));
		}
		values.push(0, offset);
	}
	values.push(0, 0, 0, 1, 0);
	const identity = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
	return values.every((v, i) => Math.abs(v - identity[i]) < 1e-9) ? undefined : values;
}
