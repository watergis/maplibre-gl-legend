/** The longest sample of a label, in code points */
export const MAX_SAMPLE_LENGTH = 12;
/** The sample when the label gives none */
export const DEFAULT_SAMPLE = 'Aa';

/** Apply `text-transform` */
export function transformText(text: string, transform: unknown): string {
	if (transform === 'uppercase') return text.toUpperCase();
	if (transform === 'lowercase') return text.toLowerCase();
	return text;
}

/**
 * The text to draw as the sample of a label: the evaluated `text-field` (a constant, an
 * expression or `{tokens}`, already resolved for the representative feature), its first
 * non-empty line, cut to `MAX_SAMPLE_LENGTH` code points; `fallback` when that is empty.
 * `text-transform` is applied.
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
	const sample = line ? [...line].slice(0, MAX_SAMPLE_LENGTH).join('').trim() : '';
	return transformText(sample || fallback, transform);
}
