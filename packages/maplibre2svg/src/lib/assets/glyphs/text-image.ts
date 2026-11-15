import type { LegendCache } from '../../core/cache';
import type { ImageEncoder } from '../../core/types';
import { encodedUrl } from '../images/data-url';
import type { SdfStyle } from '../sdf';
import { GLYPH_SIZE, type Glyph } from './decode';
import { layoutText, type TextLayout } from './layout';
import { loadGlyphRange, type GlyphFetcher } from './load';
import { rasterizeText, rasterSize, textBox } from './render';
import { glyphUrl } from './url';

/** A label drawn as an image: its URL and its size in CSS pixels */
export interface TextImage {
	href: string;
	width: number;
	height: number;
}

/** What a text image is drawn from */
export interface TextImageRequest {
	text: string;
	fontStack: string[];
	/** `style.glyphs` */
	template: string;
	textSize: number;
	letterSpacing: number;
	style: Omit<SdfStyle, 'scale'>;
	/** the largest height of the image, and four times it the largest width */
	maxSize: number;
	pixelRatio: number;
	cache: LegendCache;
	encode: ImageEncoder;
	fetchGlyphs: GlyphFetcher;
}

/**
 * The glyphs of all ranges the code points need, or undefined when one cannot be loaded. When
 * the whole font stack fails and it has several fonts, the first font alone is tried: glyph
 * servers often have no file for a combined stack.
 */
async function glyphsFor(request: TextImageRequest, codePoints: number[]) {
	const glyphs = await glyphsOfStack(request, request.fontStack, codePoints);
	if (glyphs || request.fontStack.length < 2) return glyphs;
	return glyphsOfStack(request, request.fontStack.slice(0, 1), codePoints);
}

async function glyphsOfStack(request: TextImageRequest, fontStack: string[], codePoints: number[]) {
	const urls = [...new Set(codePoints.map((cp) => glyphUrl(request.template, fontStack, cp)))];
	const ranges = await Promise.all(
		urls.map((url) => loadGlyphRange(request.cache, request.fetchGlyphs, url))
	);
	if (ranges.some((range) => range === undefined)) return undefined;
	const glyphs = new Map<number, Glyph>();
	for (const range of ranges) for (const [id, glyph] of range ?? []) glyphs.set(id, glyph);
	return glyphs;
}

/** Lay out the text, cut short from the end until it fits the width */
function fitLayout(codePoints: number[], glyphs: Map<number, Glyph>, request: TextImageRequest) {
	for (let n = codePoints.length; n > 0; n--) {
		const layout = layoutText(codePoints.slice(0, n), glyphs, request.letterSpacing);
		if (!layout) return undefined;
		// the height within maxSize
		const size = Math.min(
			request.textSize,
			(request.maxSize * GLYPH_SIZE) / (layout.bottom - layout.top)
		);
		if (textBox(layout, size).width <= request.maxSize * 4 || n === 1) return { layout, size };
	}
	return undefined;
}

/**
 * The label as an image drawn from the glyphs of the style: its URL and its size in CSS
 * pixels. Undefined whenever it cannot be drawn (a range cannot be loaded, a glyph is missing,
 * no canvas), so that the caller draws the label with a CSS font instead.
 */
export async function textImage(request: TextImageRequest): Promise<TextImage | undefined> {
	try {
		const codePoints = [...request.text].map((ch) => ch.codePointAt(0) as number);
		const glyphs = await glyphsFor(request, codePoints);
		if (!glyphs) return undefined;
		const fitted = fitLayout(codePoints, glyphs, request);
		if (!fitted) return undefined;
		return await drawn(request, fitted.layout, fitted.size);
	} catch {
		return undefined;
	}
}

async function drawn(request: TextImageRequest, layout: TextLayout, size: number) {
	const key = [
		'text',
		request.template,
		request.fontStack.join(','),
		JSON.stringify(layout.glyphs.map((g) => [g.glyph.id, g.x])),
		size,
		request.pixelRatio,
		JSON.stringify(request.style)
	].join('|');
	const raster = rasterSize(layout, size, request.pixelRatio);
	const href = await encodedUrl(
		request.cache,
		request.encode,
		key,
		raster,
		() => rasterizeText(layout, size, request.pixelRatio, request.style).pixels
	);
	if (!href) return undefined;
	const box = textBox(layout, size);
	return { href, width: box.width, height: box.height };
}
