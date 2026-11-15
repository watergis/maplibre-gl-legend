import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';
import { encodeGlyphs, fixtureGlyph } from '../assets/glyphs/fixture';
import { createLayerLegend, createLegend } from '../index';
import { fakeEncoder, solidImage } from '../test-utils';
import type { LegendImage, LegendOptions } from './types';

const GLYPHS = 'https://glyphs.test/{fontstack}/{range}.pbf';
const pbf = encodeGlyphs([...'AaNmeOtr '].map((ch) => fixtureGlyph(ch.codePointAt(0) as number)));

const symbol = (id: string, layout: Record<string, unknown>, filter?: unknown) =>
	({
		id,
		type: 'symbol',
		source: 's',
		layout,
		...(filter ? { filter } : {})
	}) as LayerSpecification;
const styleOf = (layers: LayerSpecification[], glyphs?: string) =>
	({ version: 8, sources: {}, layers, ...(glyphs ? { glyphs } : {}) }) as StyleSpecification;
const hrefs = (svg: SVGSVGElement) =>
	[...svg.querySelectorAll('image')].map((image) => image.getAttribute('href'));

describe('one cache per createLegend call', () => {
	it('encodes an image once and loads a glyph range once for all layers', async () => {
		const { encode, calls } = fakeEncoder();
		const fetchGlyphs = vi.fn(async () => pbf.slice().buffer);
		const layers = ['a', 'b', 'c'].map((id) =>
			symbol(id, { 'icon-image': 'pin', 'text-field': 'Name', 'text-font': ['Test Regular'] })
		);
		await createLegend(styleOf(layers, GLYPHS), {
			getImage: () => solidImage(4, 4),
			imageEncoder: encode,
			fetchGlyphs
		});
		expect(calls.filter((url) => url.includes('4x4/255,0,0,255'))).toHaveLength(1);
		expect(fetchGlyphs).toHaveBeenCalledTimes(1);
	});
});

describe('images under the same id', () => {
	it('are encoded again when they change', async () => {
		let image: LegendImage = solidImage(4, 4, [255, 0, 0, 255]);
		const options: LegendOptions = { getImage: () => image, imageEncoder: fakeEncoder().encode };
		options.cache = { store: new Map() };
		const layer = symbol('l', { 'icon-image': 'pin' });
		const first = await createLayerLegend(layer, styleOf([layer]), options);
		image = solidImage(8, 8, [0, 0, 255, 255]);
		const second = await createLayerLegend(layer, styleOf([layer]), options);
		expect(hrefs(first.entries[0].svg)).toEqual(['data:image/x-test,4x4/255,0,0,255']);
		expect(hrefs(second.entries[0].svg)).toEqual(['data:image/x-test,8x8/0,0,255,255']);
	});
});

describe('hostile hosts', () => {
	it('treats a listImages which gives no array as no images', async () => {
		const layer = symbol('l', { 'icon-image': '{maki}_11' });
		const legend = await createLayerLegend(layer, styleOf([layer]), {
			getImage: () => solidImage(2, 2),
			listImages: () => ({}) as unknown as string[],
			imageEncoder: fakeEncoder().encode
		});
		expect(hrefs(legend.entries[0].svg)).toEqual([]);
		expect(legend.entries[0].svg.querySelector('circle')).not.toBeNull();
	});

	it('accepts only data:image/ and blob: URLs from the encoder', async () => {
		const layer = symbol('l', { 'icon-image': 'pin' });
		const legend = await createLayerLegend(layer, styleOf([layer]), {
			getImage: () => solidImage(2, 2),
			imageEncoder: () => 'javascript:alert(1)'
		});
		expect(hrefs(legend.entries[0].svg)).toEqual([]);
	});
});

describe('{token} icon names', () => {
	const ids = ['airfield_11', 'railway_11', 'us-highway_2', 'us-interstate_2', 'us-interstate_3'];
	const options: LegendOptions = {
		getImage: (id) =>
			ids.includes(id) ? solidImage(2, 2, [ids.indexOf(id), 0, 0, 255]) : undefined,
		listImages: () => ids,
		imageEncoder: fakeEncoder().encode
	};
	const iconOf = async (layer: LayerSpecification) =>
		hrefs((await createLayerLegend(layer, styleOf([layer]), options)).entries[0].svg)[0];

	it('prefer an image which shares a word with the layer id', async () => {
		expect(await iconOf(symbol('poi-railway', { 'icon-image': '{class}_11' }))).toContain(
			'/1,0,0,255'
		);
	});

	it('are filled from the filter first, the rest matched', async () => {
		const layer = symbol(
			'highway-shield-us-interstate',
			{ 'icon-image': '{network}_{ref_length}' },
			[
				'all',
				['<=', 'ref_length', 6],
				['==', '$type', 'LineString'],
				['in', 'network', 'us-interstate']
			]
		);
		expect(await iconOf(layer)).toContain('/3,0,0,255');
	});
});

describe('label text', () => {
	const layer = symbol('label', { 'text-field': 'Name', 'text-font': ['Test Regular'] });
	const fetchGlyphs = async () => pbf.slice().buffer;

	it('is drawn from the glyphs of the style', async () => {
		const legend = await createLayerLegend(layer, styleOf([layer], GLYPHS), {
			fetchGlyphs,
			imageEncoder: fakeEncoder().encode
		});
		const svg = legend.entries[0].svg;
		expect(svg.querySelector('image')).not.toBeNull();
		expect(svg.querySelector('text')).toBeNull();
	});

	it('falls back to a CSS font without glyphs, with glyphs off, or when they fail', async () => {
		const cases: [StyleSpecification, LegendOptions][] = [
			[styleOf([layer]), { fetchGlyphs }],
			[styleOf([layer], GLYPHS), { fetchGlyphs, glyphs: false }],
			[styleOf([layer], GLYPHS), { fetchGlyphs: () => Promise.reject(new Error('404')) }],
			[styleOf([layer], GLYPHS), { fetchGlyphs, imageEncoder: () => undefined }]
		];
		for (const [style, options] of cases) {
			const legend = await createLayerLegend(layer, style, {
				imageEncoder: fakeEncoder().encode,
				...options
			});
			const text = legend.entries[0].svg.querySelector('text');
			expect(text?.textContent).toBe('Name');
			expect(text?.getAttribute('font-family')).toBe("'Test', sans-serif");
		}
	});

	it('uses sampleText for a label without text', async () => {
		const empty = symbol('l', { 'text-field': ['get', 'name'] });
		const legend = await createLayerLegend(empty, styleOf([empty]), { sampleText: 'Label' });
		expect(legend.entries[0].svg.querySelector('text')?.textContent).toBe('Label');
	});
});
