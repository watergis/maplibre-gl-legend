import type { LegendImage } from '../../lib';

/**
 * Images made in code for the stories: the demo sprite has no SDF image, and no image meant
 * as a fill pattern.
 */

/**
 * A disc as an SDF image, encoded as MapLibre's SDF icons are: alpha 0.75 at the edge, and
 * 1/8 of the range per CSS pixel of distance, inside positive
 */
export function sdfDisc(size = 24, pixelRatio = 1): LegendImage {
	const data = new Uint8ClampedArray(size * size * 4);
	const center = size / 2;
	const radius = size / 2 - 4 * pixelRatio;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const inside = radius - Math.hypot(x + 0.5 - center, y + 0.5 - center);
			data[(y * size + x) * 4 + 3] = Math.round((0.75 + inside / pixelRatio / 8) * 255);
		}
	}
	return { data, width: size, height: size, pixelRatio, sdf: true };
}

/** Diagonal hatching of 8 × 8 pixels in the color, on transparent */
export function hatch(rgb: [number, number, number] = [60, 90, 160]): LegendImage {
	const size = 8;
	const data = new Uint8ClampedArray(size * size * 4);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if ((x + y) % 8 > 1) continue;
			data.set([...rgb, 255], (y * size + x) * 4);
		}
	}
	return { data, width: size, height: size, pixelRatio: 1, sdf: false };
}
