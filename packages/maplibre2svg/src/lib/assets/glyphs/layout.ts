import { GLYPH_BORDER, GLYPH_SIZE, type Glyph } from './decode';

/** A glyph bitmap placed in glyph units (24px font), y down, the baseline at 0 */
export interface PlacedGlyph {
	glyph: Glyph;
	x: number;
	y: number;
}

/** The glyphs of a line and the box of their bitmaps */
export interface TextLayout {
	glyphs: PlacedGlyph[];
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * Lay a line of code points out along one baseline as MapLibre's shaping does: each bitmap at
 * `pen + left - border`, `-top - border`, and the pen moved by `advance` plus
 * `text-letter-spacing` (in ems). The box is the union of the bitmaps, borders included, so
 * that halos and descenders fit. Undefined when a glyph is missing or nothing is drawn.
 */
export function layoutText(
	codePoints: number[],
	glyphs: Map<number, Glyph>,
	letterSpacing = 0
): TextLayout | undefined {
	const placed: PlacedGlyph[] = [];
	let pen = 0;
	for (const codePoint of codePoints) {
		const glyph = glyphs.get(codePoint);
		if (!glyph) return undefined;
		if (glyph.width > 0 && glyph.height > 0) {
			placed.push({ glyph, x: pen + glyph.left - GLYPH_BORDER, y: -glyph.top - GLYPH_BORDER });
		}
		pen += glyph.advance + letterSpacing * GLYPH_SIZE;
	}
	if (placed.length === 0) return undefined;
	const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
	for (const { glyph, x, y } of placed) {
		box.left = Math.min(box.left, x);
		box.top = Math.min(box.top, y);
		box.right = Math.max(box.right, x + glyph.width + 2 * GLYPH_BORDER);
		box.bottom = Math.max(box.bottom, y + glyph.height + 2 * GLYPH_BORDER);
	}
	return { glyphs: placed, ...box };
}
