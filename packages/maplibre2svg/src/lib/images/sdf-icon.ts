import { resampleInto, shadeDistances, type SdfStyle } from '../sdf';
import type { LegendImage } from '../types';

/** The largest side of a tinted icon, in device pixels */
const MAX_SIDE = 256;

/** The size in device pixels to draw an icon of `width × height` CSS pixels at */
export function outputSize(width: number, height: number, pixelRatio: number) {
	const scale = Math.min(pixelRatio, MAX_SIDE / Math.max(width, height, 1e-3));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
		pixelRatio: scale
	};
}

/**
 * Tint an SDF image as MapLibre's shader does per fragment: the alpha is sampled bilinearly
 * at each output pixel of `size` (the display size at the output pixel ratio, so that a
 * large `icon-size` stays sharp), then the shape is drawn in `color` over the halo
 */
export function tintSdf(
	image: LegendImage,
	style: SdfStyle,
	size: { width: number; height: number; pixelRatio: number } = {
		width: image.width,
		height: image.height,
		pixelRatio: image.pixelRatio
	}
): Uint8ClampedArray {
	const distances = new Float32Array(size.width * size.height);
	const field = {
		data: image.data,
		width: image.width,
		height: image.height,
		stride: 4,
		channel: 3
	};
	resampleInto(field, distances, size.width, {
		left: 0,
		top: 0,
		width: size.width,
		height: size.height
	});
	return shadeDistances(distances, style, size.pixelRatio);
}
