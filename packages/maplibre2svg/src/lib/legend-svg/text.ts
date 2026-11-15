import { estimateTextWidth, type TextMeasurer } from '../util/text-measure';

/** Measures text in the font of the legend */
export type WidthOf = (text: string) => number;

/** The width of text in a font: measured when the measurer can, else estimated */
export function widthOf(measure: TextMeasurer | undefined, font: string, size: number): WidthOf {
	return (text) => measure?.(text, font) ?? estimateTextWidth(text, size);
}

/** The text, cut with an ellipsis at a grapheme boundary until it fits the width */
export function fitText(text: string, maxWidth: number, width: WidthOf): string {
	if (width(text) <= maxWidth) return text;
	const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
	const parts = Segmenter
		? [...new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
		: [...text];
	for (let n = parts.length - 1; n > 0; n--) {
		const cut = `${parts.slice(0, n).join('').trimEnd()}…`;
		if (width(cut) <= maxWidth) return cut;
	}
	return '…';
}
