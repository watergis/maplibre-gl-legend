/** The 256-code-point block of a code point, as glyph URLs name it: `0-255`, `256-511`, … */
export function glyphRange(codePoint: number): string {
	const start = Math.floor(codePoint / 256) * 256;
	return `${start}-${start + 255}`;
}

/**
 * The URL of the glyph range of a code point: `{fontstack}` is the font names, each
 * URI-encoded, joined with `,` (MapLibre joins them with `,` and lets the request encode the
 * rest), and `{range}` the block of the code point
 */
export function glyphUrl(template: string, fontStack: string[], codePoint: number): string {
	const stack = fontStack.map((font) => encodeURIComponent(font)).join(',');
	return template.replace('{fontstack}', stack).replace('{range}', glyphRange(codePoint));
}
