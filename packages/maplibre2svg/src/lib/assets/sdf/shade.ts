/** A straight RGBA color, each channel 0..1 */
export type Rgba = [number, number, number, number];

/** Constants of MapLibre's symbol SDF shader */
export const SDF_PX = 8;
export const EDGE_GAMMA = 0.105;
/** the edge of the shape: alpha 192 / 256 */
export const SDF_CUTOFF = 0.75;

/** How an SDF is drawn: the colors, the halo in CSS pixels, and the scale it is shown at */
export interface SdfStyle {
	color: Rgba;
	haloColor: Rgba;
	haloWidth: number;
	haloBlur: number;
	/** the shader's font scale: `icon-size` for icons, `text-size / 24` for text */
	scale: number;
}

/**
 * The thresholds of MapLibre's shader, for output pixels at `pixelRatio` device pixels per CSS
 * pixel: the shape is `buff ± gamma` around the distance
 */
export function sdfThresholds(style: SdfStyle, pixelRatio: number) {
	const scale = Math.max(style.scale, 1e-3);
	const edge = EDGE_GAMMA / Math.max(pixelRatio, 1e-3);
	return {
		fill: { buff: SDF_CUTOFF, gamma: edge / scale },
		halo: {
			buff: (6 - style.haloWidth / scale) / SDF_PX,
			gamma: ((style.haloBlur * 1.19) / SDF_PX + edge) / scale
		}
	};
}

const smoothstep = (e0: number, e1: number, x: number) => {
	if (e1 <= e0) return x < e0 ? 0 : 1;
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

/**
 * Turn distances (0..1, one per output pixel) into straight RGBA pixels: the shape in `color`
 * over the halo in `haloColor`, edges smoothed as the shader does
 */
export function shadeDistances(
	distances: Float32Array,
	style: SdfStyle,
	pixelRatio: number
): Uint8ClampedArray {
	const { fill, halo } = sdfThresholds(style, pixelRatio);
	const withHalo = style.haloWidth > 0 && style.haloColor[3] > 0;
	const out = new Uint8ClampedArray(distances.length * 4);
	for (let p = 0; p < distances.length; p++) {
		const dist = distances[p];
		const af = smoothstep(fill.buff - fill.gamma, fill.buff + fill.gamma, dist) * style.color[3];
		const ah = withHalo
			? smoothstep(halo.buff - halo.gamma, halo.buff + halo.gamma, dist) * style.haloColor[3]
			: 0;
		const a = af + ah * (1 - af);
		if (a <= 0) continue;
		const i = p * 4;
		for (let c = 0; c < 3; c++) {
			out[i + c] = ((style.color[c] * af + style.haloColor[c] * ah * (1 - af)) / a) * 255;
		}
		out[i + 3] = a * 255;
	}
	return out;
}
