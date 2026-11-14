import { describe, expect, it, vi } from 'vitest';
import { createLegendCache } from '../cache';
import { isImageUrl } from '../images';
import { rasterImageUrl, type RasterContext } from './source';
import { isLoadableUrl } from './url';

const ctx = (
	sources: Record<string, unknown>,
	extra: Partial<RasterContext> = {}
): RasterContext => ({
	sources,
	cache: createLegendCache(),
	center: [0, 0],
	zoom: 2,
	pixelRatio: 1,
	...extra
});

const OSM = { type: 'raster', tiles: ['https://tile.example/{z}/{x}/{y}.png'], tileSize: 256 };

describe('isLoadableUrl', () => {
	it('accepts http(s), data images, blobs and relative URLs only', () => {
		for (const url of [
			'https://a/b.png',
			'http://a',
			'data:image/png;base64,AA',
			'blob:x',
			'tiles/1.png',
			'//cdn/a.png'
		]) {
			expect(isLoadableUrl(url), url).toBe(true);
		}
		for (const url of [
			'pmtiles://a.pmtiles',
			'javascript:alert(1)',
			'data:text/html,x',
			'custom://x',
			'',
			3
		]) {
			expect(isLoadableUrl(url), String(url)).toBe(false);
		}
	});
});

describe('rasterImageUrl', () => {
	it('gives the tile of a raster source at the center and zoom', async () => {
		expect(await rasterImageUrl('osm', ctx({ osm: OSM }))).toBe('https://tile.example/3/4/4.png');
	});

	it('gives the url of an image source', async () => {
		expect(
			await rasterImageUrl(
				'img',
				ctx({ img: { type: 'image', url: 'https://a/i.png', coordinates: [] } })
			)
		).toBe('https://a/i.png');
	});

	it('gives undefined for what cannot be shown', async () => {
		const sources = {
			tilejson: { type: 'raster', url: 'https://a/tiles.json' },
			pmtiles: { type: 'raster', tiles: ['pmtiles://a.pmtiles/{z}/{x}/{y}'] },
			dem: { type: 'raster-dem', tiles: ['https://a/{z}/{x}/{y}.png'] },
			video: { type: 'video', urls: ['https://a/v.mp4'], coordinates: [] },
			canvas: { type: 'canvas', canvas: 'c', coordinates: [] }
		};
		for (const id of [...Object.keys(sources), 'missing']) {
			expect(await rasterImageUrl(id, ctx(sources)), id).toBeUndefined();
		}
	});

	it('lets the host map URLs, and validates the result', async () => {
		const source = { type: 'raster', tiles: ['pmtiles://a.pmtiles/{z}/{x}/{y}'] };
		const resolveUrl = vi.fn(async (url: string) => url.replace('pmtiles://', 'https://proxy/'));
		expect(await rasterImageUrl('p', ctx({ p: source }, { resolveUrl }))).toBe(
			'https://proxy/a.pmtiles/2/2/2'
		);
		expect(resolveUrl).toHaveBeenCalledWith('pmtiles://a.pmtiles/2/2/2', source);
		expect(
			await rasterImageUrl('p', ctx({ p: source }, { resolveUrl: () => 'javascript:x' }))
		).toBeUndefined();
		expect(await rasterImageUrl('osm', ctx({ osm: OSM }, { resolveUrl: () => undefined }))).toBe(
			'https://tile.example/3/4/4.png'
		);
		const throwing = () => {
			throw new Error('x');
		};
		expect(
			await rasterImageUrl('osm', ctx({ osm: OSM }, { resolveUrl: throwing }))
		).toBeUndefined();
	});
});

describe('image URLs of the encoder', () => {
	it('reject control characters', () => {
		expect(isImageUrl('data:image/png;base64,AA')).toBe(true);
		expect(isImageUrl('data:image/png;base64,A\nA')).toBe(false);
		expect(isImageUrl('blob:\u0000x')).toBe(false);
	});

	it('keep an image source with controls out', async () => {
		const source = { type: 'image', url: 'java\tscript:alert(1)', coordinates: [] };
		expect(await rasterImageUrl('i', ctx({ i: source }))).toBeUndefined();
	});
});
