import { describe, expect, it } from 'vitest';
import { bbox3857, lngLatToTile, quadkey, tileFor, tileUrl } from './tile';

describe('lngLatToTile', () => {
	it('gives the tile of known places', () => {
		expect(lngLatToTile(139.6917, 35.6895, 10)).toEqual({ x: 909, y: 403 });
		expect(lngLatToTile(-0.1276, 51.5072, 12)).toEqual({ x: 2046, y: 1362 });
		expect(lngLatToTile(0, 0, 1)).toEqual({ x: 1, y: 1 });
	});

	it('wraps the antimeridian and clamps the poles', () => {
		expect(lngLatToTile(180, 0, 2)).toEqual({ x: 0, y: 2 });
		expect(lngLatToTile(-180, 0, 2).x).toBe(0);
		expect(lngLatToTile(179.99, 0, 2).x).toBe(3);
		expect(lngLatToTile(540, 0, 2).x).toBe(0);
		expect(lngLatToTile(0, 90, 3).y).toBe(0);
		expect(lngLatToTile(0, -90, 3).y).toBe(7);
	});
});

describe('tileFor', () => {
	it('picks the zoom MapLibre requests for the tile size, rounded', () => {
		expect(tileFor([0, 0], 2.4, { tileSize: 256 }).z).toBe(3);
		expect(tileFor([0, 0], 2.4, { tileSize: 512 }).z).toBe(2);
		expect(tileFor([0, 0], 2.6).z).toBe(3);
		expect(tileFor([0, 0], -3, { tileSize: 256 }).z).toBe(0);
	});

	it('clamps to the zoom range of the source', () => {
		expect(tileFor([0, 0], 20, { tileSize: 256, maxzoom: 14 }).z).toBe(14);
		expect(tileFor([0, 0], 1, { tileSize: 256, minzoom: 5 }).z).toBe(5);
		expect(tileFor([0, 0], 30, { tileSize: 256 }).z).toBe(22);
	});

	it('takes the center of the bounds when the place is outside them', () => {
		const tile = tileFor([0, 0], 10, { tileSize: 512, bounds: [139, 35, 140, 36] });
		expect(tile).toEqual({ z: 10, ...lngLatToTile(139.5, 35.5, 10) });
		expect(tileFor([139.6, 35.6], 10, { tileSize: 512, bounds: [139, 35, 140, 36] })).toEqual({
			z: 10,
			...lngLatToTile(139.6, 35.6, 10)
		});
	});
});

describe('tile URL templates', () => {
	const tile = { z: 3, x: 5, y: 2 };

	it('fills z, x, y, and flips y for tms', () => {
		expect(tileUrl('https://t/{z}/{x}/{y}.png', tile, 1)).toBe('https://t/3/5/2.png');
		expect(tileUrl('https://t/{z}/{x}/{y}.png', tile, 1, 'tms')).toBe('https://t/3/5/5.png');
	});

	it('fills quadkey, bbox, ratio and prefix', () => {
		expect(quadkey(tile)).toBe('121');
		expect(tileUrl('https://t/{quadkey}{ratio}', tile, 2)).toBe('https://t/121@2x');
		expect(tileUrl('https://t/{ratio}', tile, 1)).toBe('https://t/');
		expect(tileUrl('https://t/{prefix}', tile, 1)).toBe('https://t/52');
		expect(bbox3857({ z: 0, x: 0, y: 0 })).toBe(
			'-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244'
		);
		expect(bbox3857({ z: 1, x: 1, y: 0 })).toBe('0,0,20037508.342789244,20037508.342789244');
		expect(tileUrl('https://wms?bbox={bbox}&b2={bbox-epsg-3857}', { z: 1, x: 1, y: 0 }, 1)).toBe(
			'https://wms?bbox=0,0,20037508.342789244,20037508.342789244&b2=0,0,20037508.342789244,20037508.342789244'
		);
	});
});
