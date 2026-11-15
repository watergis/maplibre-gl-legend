/** The longest sample of a label, in graphemes */
export const MAX_SAMPLE_LENGTH = 12;
/** The sample when the label gives none */
export const DEFAULT_SAMPLE = 'Aa';

/** Apply `text-transform` */
export function transformText(text: string, transform: unknown): string {
	if (transform === 'uppercase') return text.toUpperCase();
	if (transform === 'lowercase') return text.toLowerCase();
	return text;
}

/** The first `max` user-perceived characters (graphemes) of a text; code points without `Intl.Segmenter` */
export function truncateText(text: string, max: number): string {
	const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
	if (Segmenter) {
		const parts = [...new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)];
		return parts
			.slice(0, max)
			.map((part) => part.segment)
			.join('');
	}
	return [...text].slice(0, max).join('');
}

/**
 * The text to draw as the sample of a label: the evaluated `text-field` (a constant, an
 * expression or `{tokens}`, already resolved for the representative feature), its first
 * non-empty line, cut to `MAX_SAMPLE_LENGTH` graphemes. `fallback` (the `sampleText` option)
 * is used only when the layer's own text is empty. `text-transform` is applied.
 */
export function sampleText(
	textField: unknown,
	transform: unknown,
	fallback = DEFAULT_SAMPLE
): string {
	const text = typeof textField === 'string' ? textField : '';
	const line = text
		.split(/\r?\n/)
		.map((part) => part.trim())
		.find((part) => part !== '');
	const sample = line ? truncateText(line, MAX_SAMPLE_LENGTH).trim() : '';
	return transformText(sample || fallback, transform);
}
