import { describe, expect, it, vi } from 'vitest';
import { createLegendCache } from '../../core/cache';
import { RasterAdapter } from '../../adapters/raster';
import { evaluatedLayer, renderContext, withContext } from '../../test-utils';
import { RasterSourceResolver } from './raster-resolver';
import type { RasterContext } from './source';

const renderRaster = (...args: Parameters<RasterAdapter['render']>) =>
	new RasterAdapter().render(...args);

const OSM = { type: 'raster', tiles: ['https://tile.example/{z}/{x}/{y}.png'], tileSize: 256 };

const layer = (paint: Record<string, unknown> = {}) => ({
	...evaluatedLayer('raster', paint),
	original: { id: 'r', type: 'raster', source: 'osm', paint } as never
});
const context = (raster: Partial<RasterContext> = {}) =>
	withContext(renderContext(), {
		raster: new RasterSourceResolver({
			sources: { osm: OSM },
			center: [0, 0],
			zoom: 2,
			pixelRatio: 1,
			cache: createLegendCache(),
			...raster
		})
	});
const children = (svg: SVGSVGElement) =>
	[...svg.children].map((c) => c.getAttribute('data-placeholder') ?? c.tagName.toLowerCase());

describe('renderRaster', () => {
	it('draws a tile which loads over a plain backdrop, clipped, with opacity and the color matrix', async () => {
		const symbol = await renderRaster(
			layer({ 'raster-opacity': 0.5, 'raster-saturation': -1 }),
			context({ loadImage: async () => true })
		);
		expect(children(symbol.svg)).toEqual(['defs', 'rect', 'image', 'rect']);
		const image = symbol.svg.querySelector('image');
		expect(image?.getAttribute('opacity')).toBe('0.5');
		const filter = symbol.svg.querySelector('filter');
		expect(filter?.getAttribute('color-interpolation-filters')).toBe('sRGB');
		expect(image?.getAttribute('filter')).toBe(`url(#${filter?.id})`);
		expect(image?.getAttribute('clip-path')).toBe(
			`url(#${symbol.svg.querySelector('clipPath')?.id})`
		);
		expect(symbol.svg.querySelector('[data-placeholder]')).toBeNull();
	});

	it('writes no filter for the identity', async () => {
		const symbol = await renderRaster(layer({ 'raster-hue-rotate': 360 }), context());
		expect(symbol.svg.querySelector('filter')).toBeNull();
		expect(symbol.svg.querySelector('image')?.hasAttribute('filter')).toBe(false);
	});

	it('draws only the mosaic for a tile which does not load, checked once per URL', async () => {
		const loadImage = vi.fn(async () => false);
		const ctx = context({ loadImage });
		const a = await renderRaster(layer(), ctx);
		await renderRaster(layer(), ctx);
		expect(children(a.svg)).toEqual(['raster', 'rect']);
		expect(a.svg.querySelector('image')).toBeNull();
		expect(loadImage).toHaveBeenCalledTimes(1);
	});

	it('treats a loader which throws as a tile which does not load', async () => {
		const symbol = await renderRaster(
			layer(),
			context({ loadImage: () => Promise.reject(new Error('x')) })
		);
		expect(symbol.svg.querySelector('image')).toBeNull();
	});

	it('uses the tile when loading cannot be checked, and the mosaic without a tile', async () => {
		expect((await renderRaster(layer(), context())).svg.querySelector('image')).not.toBeNull();
		const none = await renderRaster(layer(), context({ sources: {} }));
		expect(children(none.svg)).toEqual(['raster', 'rect']);
	});

	it('gives different thumbnails for different sources', async () => {
		const a = await renderRaster(layer(), context());
		const other = { ...layer(), original: { id: 'r2', type: 'raster', source: 'sat' } as never };
		const b = await renderRaster(
			other,
			context({ sources: { sat: { ...OSM, tiles: ['https://sat/{z}/{y}/{x}'] } } })
		);
		expect(a.svg.querySelector('image')?.getAttribute('href')).not.toBe(
			b.svg.querySelector('image')?.getAttribute('href')
		);
	});
});
