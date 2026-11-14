import { describe, expect, it, vi } from 'vitest';
import { createLegendCache } from '../cache';
import { fakeEncoder } from '../test-utils';
import { cssFont } from './css-font';
import { decodeGlyphs } from './decode';
import { encodeGlyphs, fixtureGlyph } from './fixture';
import { textImage, type TextImageRequest } from './index';
import { layoutText } from './layout';
import { loadGlyphRange } from './load';
import { sampleText } from './sample';
import { glyphRange, glyphUrl } from './url';

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '].map((ch, i) =>
	fixtureGlyph(
		ch.codePointAt(0) as number,
		ch === ' ' ? { width: 0, height: 0, advance: 6 } : { left: i % 2 }
	)
);
const pbf = encodeGlyphs(ALPHABET);
const buffer = () => pbf.slice().buffer;

describe('glyph URLs', () => {
	it('joins the font stack and names the range of the code point', () => {
		const template = 'https://example.com/{fontstack}/{range}.pbf';
		expect(glyphUrl(template, ['Noto Sans Regular', 'Arial Unicode MS'], 65)).toBe(
			'https://example.com/Noto%20Sans%20Regular,Arial%20Unicode%20MS/0-255.pbf'
		);
		expect(glyphRange(0x4e00)).toBe('19968-20223');
		expect(glyphRange(0x1f600)).toBe('128512-128767');
		expect(glyphRange(255)).toBe('0-255');
		expect(glyphRange(256)).toBe('256-511');
	});
});

describe('decodeGlyphs', () => {
	it('reads every field, negative left and top included', () => {
		const glyphs = decodeGlyphs(
			encodeGlyphs([fixtureGlyph(65, { left: -3, top: -12, advance: 9 }, 200)])
		);
		const a = glyphs.get(65);
		expect(a).toMatchObject({ id: 65, width: 4, height: 6, left: -3, top: -12, advance: 9 });
		expect(a?.bitmap.length).toBe(10 * 12);
		expect(a?.bitmap[0]).toBe(200);
	});

	it('keeps glyphs without a bitmap, such as a space, and drops broken ones', () => {
		const glyphs = decodeGlyphs(
			encodeGlyphs([
				fixtureGlyph(32, { width: 0, height: 0, advance: 6 }),
				{ ...fixtureGlyph(66), bitmap: new Uint8Array(3) }
			])
		);
		expect(glyphs.get(32)?.advance).toBe(6);
		expect(glyphs.has(66)).toBe(false);
	});

	it('throws on a truncated buffer', () => {
		expect(() => decodeGlyphs(pbf.slice(0, 20))).toThrow();
	});
});

describe('layoutText', () => {
	const glyphs = new Map([
		[65, fixtureGlyph(65, { left: 1, top: 10, advance: 8 })],
		[66, fixtureGlyph(66, { left: -1, top: 4, advance: 10, height: 8 })]
	]);

	it('places bitmaps by advance, left and top around one baseline', () => {
		const layout = layoutText([65, 66], glyphs);
		expect(layout?.glyphs.map((g) => [g.x, g.y])).toEqual([
			[1 - 3, -10 - 3],
			[8 - 1 - 3, -4 - 3]
		]);
		expect(layout).toMatchObject({ left: -2, top: -13, right: 4 + 4 + 6, bottom: -7 + 14 });
	});

	it('adds the letter spacing in ems', () => {
		const layout = layoutText([65, 66], glyphs, 0.25);
		expect(layout?.glyphs[1].x).toBe(8 + 6 - 1 - 3);
	});

	it('gives undefined for a missing glyph', () => {
		expect(layoutText([65, 67], glyphs)).toBeUndefined();
	});
});

describe('sampleText', () => {
	it('takes the first non-empty line, cut on code points, and transforms it', () => {
		expect(sampleText('Main Street', undefined)).toBe('Main Street');
		expect(sampleText('\nSecond', 'uppercase')).toBe('SECOND');
		expect(sampleText('A very long label name', undefined)).toBe('A very long');
		expect(sampleText('😀😀😀😀😀😀😀😀😀😀😀😀😀😀', undefined)).toHaveLength(24);
		expect(sampleText('', undefined)).toBe('Aa');
		expect(sampleText(' \n ', 'lowercase', 'Label')).toBe('label');
		expect(sampleText(undefined, undefined)).toBe('Aa');
	});
});

describe('cssFont', () => {
	it('splits the weight and style words off the family', () => {
		expect(cssFont(['Noto Sans Bold Italic'])).toEqual({
			family: "'Noto Sans', sans-serif",
			weight: 'bold',
			style: 'italic'
		});
		expect(cssFont(['Open Sans Semi Bold'])).toMatchObject({ family: "'Open Sans', sans-serif" });
		expect(cssFont(undefined)).toEqual({
			family: 'sans-serif',
			weight: undefined,
			style: undefined
		});
	});
});

describe('loadGlyphRange', () => {
	it('loads a range once, shares concurrent requests and remembers failures', async () => {
		const cache = createLegendCache();
		const fetchGlyphs = vi.fn(async (url: string) => {
			if (url.includes('missing')) throw new Error('404');
			return buffer();
		});
		const [a, b] = await Promise.all([
			loadGlyphRange(cache, fetchGlyphs, 'ok'),
			loadGlyphRange(cache, fetchGlyphs, 'ok')
		]);
		expect(a).toBe(b);
		expect(a?.size).toBe(ALPHABET.length);
		expect(await loadGlyphRange(cache, fetchGlyphs, 'missing')).toBeUndefined();
		expect(await loadGlyphRange(cache, fetchGlyphs, 'missing')).toBeUndefined();
		expect(fetchGlyphs).toHaveBeenCalledTimes(2);
	});
});

describe('textImage', () => {
	const request = (overrides: Partial<TextImageRequest> = {}): TextImageRequest => ({
		text: 'Ab',
		fontStack: ['Test Regular'],
		template: 'https://glyphs/{fontstack}/{range}.pbf',
		textSize: 12,
		letterSpacing: 0,
		style: { color: [0, 0, 0, 1], haloColor: [1, 1, 1, 1], haloWidth: 1, haloBlur: 0 },
		maxSize: 40,
		pixelRatio: 2,
		cache: createLegendCache(),
		encode: fakeEncoder().encode,
		fetchGlyphs: async () => buffer(),
		...overrides
	});

	it('draws the text at text-size, at the pixel ratio', async () => {
		const image = await textImage(request());
		expect(image?.href).toMatch(/^data:image\/x-test,\d+x\d+\//);
		// box of the bitmaps at 24px: scaled by 12 / 24
		expect(image?.height).toBeCloseTo(12 / 2);
		const [w, h] = (image?.href.match(/,(\d+)x(\d+)/) ?? []).slice(1).map(Number);
		expect(w).toBe(Math.ceil((image?.width ?? 0) * 2));
		expect(h).toBe(Math.ceil((image?.height ?? 0) * 2));
	});

	it('clamps the size so that the height fits maxSize', async () => {
		const image = await textImage(request({ textSize: 400 }));
		expect(image?.height).toBeCloseTo(40);
	});

	it('gives undefined, for the CSS fallback, when it cannot draw', async () => {
		expect(
			await textImage(request({ fetchGlyphs: () => Promise.reject(new Error('x')) }))
		).toBeUndefined();
		expect(
			await textImage(request({ fetchGlyphs: async () => new ArrayBuffer(3) }))
		).toBeUndefined();
		expect(await textImage(request({ text: '漢字' }))).toBeUndefined();
		expect(await textImage(request({ encode: () => undefined }))).toBeUndefined();
	});
});
