/** A single-channel field of distances, such as the alpha of an SDF icon or a glyph bitmap */
export interface DistanceField {
	data: ArrayLike<number>;
	width: number;
	height: number;
	/** bytes per pixel, 4 for RGBA and 1 for a glyph bitmap */
	stride: number;
	/** byte of the channel in a pixel, 3 for the alpha of RGBA */
	channel: number;
}

/** The value of a pixel; outside the field, the nearest edge pixel (clamp to edge) */
const at = (field: DistanceField, x: number, y: number) => {
	const cx = Math.min(field.width - 1, Math.max(0, x));
	const cy = Math.min(field.height - 1, Math.max(0, y));
	return field.data[(cy * field.width + cx) * field.stride + field.channel];
};

/**
 * The distance (0..1) at a point of the field, in field pixels with centers at `i + 0.5`,
 * bilinearly interpolated as the GPU samples the texture, clamped to the edge.
 */
export function sampleDistance(field: DistanceField, x: number, y: number): number {
	const fx = x - 0.5;
	const fy = y - 0.5;
	const x0 = Math.floor(fx);
	const y0 = Math.floor(fy);
	const tx = fx - x0;
	const ty = fy - y0;
	const top = at(field, x0, y0) * (1 - tx) + at(field, x0 + 1, y0) * tx;
	const bottom = at(field, x0, y0 + 1) * (1 - tx) + at(field, x0 + 1, y0 + 1) * tx;
	return (top * (1 - ty) + bottom * ty) / 255;
}

/**
 * Resample a whole field to `width × height` output pixels, into `out` at `(left, top)` of an
 * output `outWidth` wide, keeping the larger distance where fields overlap (glyphs of a text)
 */
export function resampleInto(
	field: DistanceField,
	out: Float32Array,
	outWidth: number,
	rect: { left: number; top: number; width: number; height: number }
) {
	const sx = field.width / rect.width;
	const sy = field.height / rect.height;
	const outHeight = out.length / outWidth;
	const x0 = Math.max(0, Math.floor(rect.left));
	const y0 = Math.max(0, Math.floor(rect.top));
	const x1 = Math.min(outWidth, Math.ceil(rect.left + rect.width));
	const y1 = Math.min(outHeight, Math.ceil(rect.top + rect.height));
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const d = sampleDistance(field, (x + 0.5 - rect.left) * sx, (y + 0.5 - rect.top) * sy);
			const i = y * outWidth + x;
			if (d > out[i]) out[i] = d;
		}
	}
}
