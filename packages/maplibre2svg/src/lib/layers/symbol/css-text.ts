import { cssFont } from '../../glyphs';
import { el } from '../../svg';
import type { SymbolPart } from './part';

/** What a label is drawn with */
export interface TextLook {
	text: string;
	fontStack: unknown;
	size: number;
	letterSpacing: number;
	color: { color: string; opacity: number };
	halo: { color: string; opacity: number; width: number };
}

/** Height of the box in ems, with room for descenders, and the baseline in it */
const LINE_HEIGHT = 1.25;
const ASCENT = 0.95;

/**
 * Rough advance of a character in ems, for the box of a CSS label: wide for CJK and full-width
 * forms, narrow for spaces and slim letters, wider for capitals
 */
export function charWidth(ch: string): number {
	const cp = ch.codePointAt(0) ?? 0;
	if (
		cp >= 0x1100 &&
		(cp <= 0x115f ||
			(cp >= 0x2e80 && cp <= 0xa4cf) ||
			(cp >= 0xac00 && cp <= 0xd7a3) ||
			(cp >= 0xf900 && cp <= 0xfaff) ||
			(cp >= 0xff00 && cp <= 0xff60) ||
			cp >= 0x20000)
	) {
		return 1;
	}
	if (/[\s.,:;'|!il]/.test(ch)) return 0.3;
	if (/[A-Z0-9mwMW]/.test(ch)) return 0.68;
	return 0.56;
}

/**
 * The label as SVG `<text>` in a CSS font: the family from the first font of `text-font`
 * (weight and style words into `font-weight` / `font-style`), the halo as a stroke beneath the
 * fill (`paint-order`). The box is estimated, halo included, like the box of a glyph image,
 * and the text is fitted to it (`textLength`) so that no font of the browser overflows it.
 */
export function cssTextPart(doc: Document, look: TextLook): SymbolPart {
	const font = cssFont(look.fontStack);
	const halo = Math.max(0, look.halo.width);
	const chars = [...look.text];
	const advance = chars.reduce((sum, ch) => sum + charWidth(ch), 0);
	const textWidth = look.size * (advance + look.letterSpacing * Math.max(0, chars.length - 1));
	const width = textWidth + 2 * halo;
	const height = look.size * LINE_HEIGHT + 2 * halo;
	const text = el(doc, 'text', {
		x: halo,
		y: halo + look.size * ASCENT,
		textLength: textWidth > 0 ? textWidth : undefined,
		lengthAdjust: 'spacingAndGlyphs',
		'font-family': font.family,
		'font-weight': font.weight,
		'font-style': font.style,
		'font-size': look.size,
		'letter-spacing': look.letterSpacing ? `${look.letterSpacing}em` : undefined,
		fill: look.color.color,
		'fill-opacity': look.color.opacity,
		stroke: halo > 0 ? look.halo.color : undefined,
		'stroke-opacity': halo > 0 ? look.halo.opacity : undefined,
		'stroke-width': halo > 0 ? 2 * halo : undefined,
		'stroke-linejoin': halo > 0 ? 'round' : undefined,
		'paint-order': halo > 0 ? 'stroke' : undefined
	});
	text.textContent = look.text;
	return { nodes: [text], defs: [], width, height };
}
