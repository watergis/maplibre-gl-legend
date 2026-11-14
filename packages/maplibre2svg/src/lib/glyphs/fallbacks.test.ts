import { describe, expect, it, vi } from 'vitest';
import { createLegendCache } from '../cache';
import { cssTextPart, textWidth, type TextLook } from '../layers/symbol/css-text';
import { fakeEncoder } from '../test-utils';
import { canvasMeasurer, fontShorthand } from '../text-measure';
import { encodeGlyphs, fixtureGlyph } from './fixture';
import { textImage, type TextImageRequest } from './index';
import { sampleText, truncateText } from './sample';

describe('font stacks', () => {
	it('retry the first font alone when the whole stack fails', async () => {
		const pbf = encodeGlyphs([...'Ab'].map((ch) => fixtureGlyph(ch.codePointAt(0) as number)));
		const fetchGlyphs = vi.fn(async (url: string) => {
			if (url.includes(',')) throw new Error('404');
			return pbf.slice().buffer;
		});
		const request: TextImageRequest = {
			text: 'Ab',
			fontStack: ['Noto Sans Regular', 'Arial Unicode MS Regular'],
			template: 'https://g/{fontstack}/{range}.pbf',
			textSize: 12,
			letterSpacing: 0,
			style: { color: [0, 0, 0, 1], haloColor: [0, 0, 0, 0], haloWidth: 0, haloBlur: 0 },
			maxSize: 40,
			pixelRatio: 1,
			cache: createLegendCache(),
			encode: fakeEncoder().encode,
			fetchGlyphs
		} as const;
		const first = await textImage({ ...request, style: { ...request.style, color: [0, 0, 0, 1] } });
		const second = await textImage({
			...request,
			style: { ...request.style, color: [0, 0, 0, 1] }
		});
		expect(first).toBeDefined();
		expect(second?.href).toBe(first?.href);
		expect(fetchGlyphs.mock.calls.map(([url]) => url)).toEqual([
			'https://g/Noto%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf',
			'https://g/Noto%20Sans%20Regular/0-255.pbf'
		]);
	});
});

describe('samples', () => {
	it('are cut on grapheme boundaries', () => {
		const family = '👨‍👩‍👧';
		expect(truncateText(family.repeat(3), 2)).toBe(family.repeat(2));
		expect(truncateText('ééé', 2)).toBe('éé');
		expect(sampleText(family.repeat(20), undefined)).toBe(family.repeat(12));
	});
});

describe('CSS label widths', () => {
	const look: TextLook = {
		text: 'MWMW',
		fontStack: ['Noto Sans Bold'],
		size: 10,
		letterSpacing: 0.1,
		color: { color: '#000000', opacity: 1 },
		halo: { color: '#ffffff', opacity: 1, width: 1 }
	};

	it('are measured when a measurer can, with the letter spacing added', () => {
		const measure = vi.fn(() => 50);
		expect(textWidth(look, measure)).toEqual({ width: 53, estimated: false });
		expect(measure).toHaveBeenCalledWith('MWMW', "bold 10px 'Noto Sans', sans-serif");
		const node = cssTextPart(document, look, measure).nodes[0];
		expect(node.hasAttribute('textLength')).toBe(false);
		expect(node.hasAttribute('lengthAdjust')).toBe(false);
	});

	it('are estimated otherwise, and only the spacing is fitted', () => {
		const width = textWidth(look, () => undefined);
		expect(width.estimated).toBe(true);
		expect(width.width).toBeCloseTo(4 * 6.8 + 3);
		const part = cssTextPart(document, look);
		expect(part.width).toBeCloseTo(width.width + 2);
		expect(part.nodes[0].getAttribute('lengthAdjust')).toBe('spacing');
	});

	it('cannot be measured without a canvas', () => {
		expect(canvasMeasurer(document)('Abc', '10px sans-serif')).toBeUndefined();
		expect(fontShorthand({ family: 'serif', style: 'italic' }, 12)).toBe('italic 12px serif');
	});
});
