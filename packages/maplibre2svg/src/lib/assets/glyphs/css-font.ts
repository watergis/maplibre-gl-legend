/** The CSS font of a `text-font` stack, as the maplibre-gl-export SVG does it */
export interface CssFont {
	family: string;
	weight?: string;
	style?: string;
}

/**
 * The CSS font of the first font of the stack: the family without the weight and style words,
 * which become `font-weight` and `font-style`
 */
export function cssFont(fontStack: unknown): CssFont {
	const name = Array.isArray(fontStack) && typeof fontStack[0] === 'string' ? fontStack[0] : '';
	const bold = /\b(bold|black|heavy)\b/i.test(name);
	const italic = /\b(italic|oblique)\b/i.test(name);
	const family = name
		.replace(/\b(regular|semi|bold|black|heavy|medium|light|italic|oblique|semibold|book)\b/gi, '')
		.replace(/\s+/g, ' ')
		.trim();
	return {
		family: family ? `'${family}', sans-serif` : 'sans-serif',
		weight: bold ? 'bold' : undefined,
		style: italic ? 'italic' : undefined
	};
}
