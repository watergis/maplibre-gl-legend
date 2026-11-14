import type { LegendImage } from '../../lib';

/**
 * Images made in code for the stories: the sprites have no image meant as a fill pattern.
 */

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
