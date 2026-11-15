import { PbfReader } from './pbf';

/** The bitmaps of a glyph PBF have a border of 3 pixels around the glyph */
export const GLYPH_BORDER = 3;
/** The font size the glyph PBFs are rendered at */
export const GLYPH_SIZE = 24;

/**
 * A glyph of a PBF range, as MapLibre's `parse_glyph_pbf.ts` reads it. The bitmap is an SDF
 * of `(width + 6) × (height + 6)` bytes; `left` and `top` place it relative to the pen on the
 * baseline (`top` upwards), `advance` moves the pen.
 */
export interface Glyph {
	id: number;
	bitmap: Uint8Array;
	width: number;
	height: number;
	left: number;
	top: number;
	advance: number;
}

function readGlyph(pbf: PbfReader): Glyph {
	const glyph: Glyph = {
		id: 0,
		bitmap: new Uint8Array(),
		width: 0,
		height: 0,
		left: 0,
		top: 0,
		advance: 0
	};
	while (!pbf.done) {
		const { field, type } = pbf.readTag();
		if (field === 1 && type === 0) glyph.id = pbf.readVarint();
		else if (field === 2 && type === 2) glyph.bitmap = pbf.readBytes();
		else if (field === 3 && type === 0) glyph.width = pbf.readVarint();
		else if (field === 4 && type === 0) glyph.height = pbf.readVarint();
		else if (field === 5 && type === 0) glyph.left = pbf.readSVarint();
		else if (field === 6 && type === 0) glyph.top = pbf.readSVarint();
		else if (field === 7 && type === 0) glyph.advance = pbf.readVarint();
		else pbf.skip(type);
	}
	return glyph;
}

function readFontstack(pbf: PbfReader, glyphs: Map<number, Glyph>) {
	while (!pbf.done) {
		const { field, type } = pbf.readTag();
		if (field === 3 && type === 2) {
			const glyph = readGlyph(new PbfReader(pbf.readBytes()));
			const size =
				glyph.width > 0 ? (glyph.width + 2 * GLYPH_BORDER) * (glyph.height + 2 * GLYPH_BORDER) : 0;
			// a glyph whose bitmap does not match its size cannot be drawn
			if (glyph.bitmap.length === size) glyphs.set(glyph.id, glyph);
		} else pbf.skip(type);
	}
}

/** Decode a glyph PBF (`glyphs { fontstack stacks = 1 { glyph glyphs = 3 } }`) by code point */
export function decodeGlyphs(data: ArrayBuffer | Uint8Array): Map<number, Glyph> {
	const pbf = new PbfReader(data instanceof Uint8Array ? data : new Uint8Array(data));
	const glyphs = new Map<number, Glyph>();
	while (!pbf.done) {
		const { field, type } = pbf.readTag();
		if (field === 1 && type === 2) readFontstack(new PbfReader(pbf.readBytes()), glyphs);
		else pbf.skip(type);
	}
	return glyphs;
}
