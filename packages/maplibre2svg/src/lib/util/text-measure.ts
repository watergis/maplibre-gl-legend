import type { CssFont } from '../assets/glyphs';

/** Measures the width of text in a CSS font shorthand, in CSS pixels; undefined when it cannot */
export type TextMeasurer = (text: string, font: string) => number | undefined;

/** The CSS `font` shorthand of a font at a size */
export function fontShorthand(font: CssFont, size: number): string {
	return [font.style, font.weight, `${size}px`, font.family].filter(Boolean).join(' ');
}

/**
 * Measure with a 2D canvas of the document (`measureText`), each text and font once. Gives
 * undefined without a canvas, such as in Node or happy-dom.
 */
export function canvasMeasurer(doc: Document): TextMeasurer {
	const widths = new Map<string, number | undefined>();
	let context: CanvasRenderingContext2D | null | undefined;
	return (text, font) => {
		const key = `${font}|${text}`;
		if (widths.has(key)) return widths.get(key);
		let width: number | undefined;
		try {
			context ??= doc.createElement('canvas').getContext?.('2d') ?? null;
			if (context) {
				context.font = font;
				const measured = context.measureText(text).width;
				width = Number.isFinite(measured) && measured > 0 ? measured : undefined;
			}
		} catch {
			context = null;
		}
		widths.set(key, width);
		return width;
	};
}

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

/** The estimated width of a text at a font size, without a measurer */
export function estimateTextWidth(text: string, size: number): number {
	return [...text].reduce((sum, ch) => sum + charWidth(ch), 0) * size;
}

/**
 * A measurer which never throws and gives only finite, non-negative widths: anything else from
 * the host's measurer counts as "cannot measure", so that the width is estimated
 */
export function safeMeasurer(measure: TextMeasurer | undefined): TextMeasurer {
	return (text, font) => {
		try {
			const width = measure?.(text, font);
			return typeof width === 'number' && Number.isFinite(width) && width >= 0 ? width : undefined;
		} catch {
			return undefined;
		}
	};
}
