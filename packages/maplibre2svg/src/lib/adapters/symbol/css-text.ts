import { cssFont } from '../../assets/glyphs';
import { el } from '../../render/svg';
import { charWidth, fontShorthand, type TextMeasurer } from '../../util/text-measure';
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
 * The width of the text, measured with the measurer when it can, else estimated from the
 * characters. `estimated` tells which: an estimate is fitted with `textLength`, spacing only.
 */
export function textWidth(look: TextLook, measure?: TextMeasurer) {
	const chars = [...look.text];
	const spacing = look.letterSpacing * look.size * Math.max(0, chars.length - 1);
	const measured = measure?.(look.text, fontShorthand(cssFont(look.fontStack), look.size));
	if (measured !== undefined) return { width: measured + spacing, estimated: false };
	const advance = chars.reduce((sum, ch) => sum + charWidth(ch), 0);
	return { width: look.size * advance + spacing, estimated: true };
}

/**
 * The label as SVG `<text>` in a CSS font: the family from the first font of `text-font`
 * (weight and style words into `font-weight` / `font-style`), the halo as a stroke beneath the
 * fill (`paint-order`). The box is the measured width (or an estimate, which `textLength` with
 * `lengthAdjust="spacing"` then enforces), with the halo, like the box of a glyph image.
 */
export function cssTextPart(doc: Document, look: TextLook, measure?: TextMeasurer): SymbolPart {
	const font = cssFont(look.fontStack);
	const halo = Math.max(0, look.halo.width);
	const text = textWidth(look, measure);
	const width = text.width + 2 * halo;
	const height = look.size * LINE_HEIGHT + 2 * halo;
	const node = el(doc, 'text', {
		x: halo,
		y: halo + look.size * ASCENT,
		textLength: text.estimated && text.width > 0 ? text.width : undefined,
		lengthAdjust: text.estimated ? 'spacing' : undefined,
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
	node.textContent = look.text;
	return { nodes: [node], defs: [], width, height };
}
