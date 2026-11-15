import { resampleInto, shadeDistances, type SdfStyle } from '../sdf';
import { GLYPH_BORDER, GLYPH_SIZE } from './decode';
import type { TextLayout } from './layout';

/** Size of laid-out text at a font size, in CSS pixels */
export function textBox(layout: TextLayout, textSize: number) {
	const scale = textSize / GLYPH_SIZE;
	return {
		width: (layout.right - layout.left) * scale,
		height: (layout.bottom - layout.top) * scale
	};
}

/** Size of the raster of laid-out text, in device pixels */
export function rasterSize(layout: TextLayout, textSize: number, pixelRatio: number) {
	const scale = (textSize / GLYPH_SIZE) * pixelRatio;
	return {
		width: Math.max(1, Math.ceil((layout.right - layout.left) * scale)),
		height: Math.max(1, Math.ceil((layout.bottom - layout.top) * scale))
	};
}

/**
 * Draw laid-out text at `textSize` CSS pixels and `pixelRatio` device pixels per CSS pixel:
 * every glyph SDF is sampled bilinearly at the output pixels (the larger distance where glyphs
 * overlap), then shaded with the fill and halo of the shader, the font scale `textSize / 24`
 */
export function rasterizeText(
	layout: TextLayout,
	textSize: number,
	pixelRatio: number,
	style: Omit<SdfStyle, 'scale'>
) {
	const scale = (textSize / GLYPH_SIZE) * pixelRatio;
	const { width, height } = rasterSize(layout, textSize, pixelRatio);
	const distances = new Float32Array(width * height);
	for (const { glyph, x, y } of layout.glyphs) {
		const field = {
			data: glyph.bitmap,
			width: glyph.width + 2 * GLYPH_BORDER,
			height: glyph.height + 2 * GLYPH_BORDER,
			stride: 1,
			channel: 0
		};
		resampleInto(field, distances, width, {
			left: (x - layout.left) * scale,
			top: (y - layout.top) * scale,
			width: field.width * scale,
			height: field.height * scale
		});
	}
	const pixels = shadeDistances(distances, { ...style, scale: textSize / GLYPH_SIZE }, pixelRatio);
	return { pixels, width, height };
}
