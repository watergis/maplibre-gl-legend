import type { LegendImage } from '../types';

/** A straight RGBA color, each channel 0..1 */
export type Rgba = [number, number, number, number];

/** How MapLibre's symbol SDF shader draws an icon */
export const SDF_PX = 8;
export const EDGE_GAMMA = 0.105;
/** the edge of the shape: alpha 192 / 256 */
export const SDF_CUTOFF = 0.75;

export interface SdfTint {
	color: Rgba;
	haloColor: Rgba;
	/** `icon-halo-width` in CSS pixels */
	haloWidth: number;
	/** `icon-halo-blur` in CSS pixels */
	haloBlur: number;
	/** `icon-size`, the scale the icon is displayed at */
	size: number;
}

const smoothstep = (e0: number, e1: number, x: number) => {
	if (e1 <= e0) return x < e0 ? 0 : 1;
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

/**
 * The thresholds of MapLibre's shader for an icon displayed at `size`, with the image drawn at
 * its own pixel ratio: `buff ± gamma` around the distance.
 */
export function sdfThresholds(tint: SdfTint, pixelRatio: number) {
	const size = Math.max(tint.size, 1e-3);
	const edge = EDGE_GAMMA / Math.max(pixelRatio, 1e-3);
	return {
		fill: { buff: SDF_CUTOFF, gamma: edge / size },
		halo: {
			buff: (6 - tint.haloWidth / size) / SDF_PX,
			gamma: ((tint.haloBlur * 1.19) / SDF_PX + edge) / size
		}
	};
}

/**
 * Tint an SDF image: the shape in `color`, over a halo in `haloColor` when `haloWidth > 0`,
 * with edges anti-aliased by a smoothstep around the cutoff as MapLibre does. Gives straight
 * RGBA pixels of the same size.
 */
export function tintSdf(image: LegendImage, tint: SdfTint): Uint8ClampedArray {
	const { fill, halo } = sdfThresholds(tint, image.pixelRatio);
	const withHalo = tint.haloWidth > 0 && tint.haloColor[3] > 0;
	const out = new Uint8ClampedArray(image.width * image.height * 4);
	for (let i = 0; i < out.length; i += 4) {
		const dist = image.data[i + 3] / 255;
		const af = smoothstep(fill.buff - fill.gamma, fill.buff + fill.gamma, dist) * tint.color[3];
		const ah = withHalo
			? smoothstep(halo.buff - halo.gamma, halo.buff + halo.gamma, dist) * tint.haloColor[3]
			: 0;
		const a = af + ah * (1 - af);
		if (a <= 0) continue;
		for (let c = 0; c < 3; c++) {
			out[i + c] = ((tint.color[c] * af + tint.haloColor[c] * ah * (1 - af)) / a) * 255;
		}
		out[i + 3] = a * 255;
	}
	return out;
}
