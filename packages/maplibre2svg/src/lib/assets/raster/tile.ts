/** A tile of a source */
export interface TileCoord {
	z: number;
	x: number;
	y: number;
}

/** What of a raster source decides which tile shows a place */
export interface TileSourceInfo {
	tileSize?: number;
	minzoom?: number;
	maxzoom?: number;
	/** `[west, south, east, north]` */
	bounds?: number[];
	scheme?: string;
}

const MAX_LATITUDE = 85.051129;
const EXTENT = 20037508.342789244;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The tile at `z` which holds a place, the longitude wrapped and the latitude clamped */
export function lngLatToTile(lng: number, lat: number, z: number): { x: number; y: number } {
	const n = 2 ** z;
	const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
	const phi = (clamp(lat, -MAX_LATITUDE, MAX_LATITUDE) * Math.PI) / 180;
	const x = Math.floor(((wrapped + 180) / 360) * n);
	const y = Math.floor(((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * n);
	return { x: clamp(x, 0, n - 1), y: clamp(y, 0, n - 1) };
}

/** The center of the bounds, or the place when it lies inside them */
function insideBounds(center: [number, number], bounds?: number[]): [number, number] {
	if (!bounds || bounds.length !== 4 || !bounds.every(Number.isFinite)) return center;
	const [west, south, east, north] = bounds;
	const [lng, lat] = center;
	if (lng >= west && lng <= east && lat >= south && lat <= north) return center;
	return [(west + east) / 2, (south + north) / 2];
}

/**
 * The tile MapLibre requests for a raster source at the place and zoom: the zoom of a 512px
 * map grid, shifted by the tile size (a 256px source shows at z + 1 what a 512px source shows
 * at z) and rounded as raster sources round it, clamped to the source's zoom range and 0–22
 */
export function tileFor(
	center: [number, number],
	zoom: number,
	source: TileSourceInfo = {}
): TileCoord {
	const tileSize = source.tileSize && source.tileSize > 0 ? source.tileSize : 512;
	const min = clamp(source.minzoom ?? 0, 0, 22);
	const max = clamp(source.maxzoom ?? 22, min, 22);
	const raw = Math.round((Number.isFinite(zoom) ? zoom : 0) + Math.log2(512 / tileSize));
	const z = clamp(raw, min, max);
	const [lng, lat] = insideBounds(center, source.bounds);
	return { z, ...lngLatToTile(lng, lat, z) };
}

/** The quadkey of a tile (Bing) */
export function quadkey({ z, x, y }: TileCoord): string {
	let key = '';
	for (let i = z; i > 0; i--) {
		const mask = 1 << (i - 1);
		key += (x & mask ? 1 : 0) + (y & mask ? 2 : 0);
	}
	return key;
}

/** The bounds of a tile in EPSG:3857 as `minX,minY,maxX,maxY`, y up (WMS) */
export function bbox3857({ z, x, y }: TileCoord): string {
	const size = (2 * EXTENT) / 2 ** z;
	const row = 2 ** z - y - 1;
	return [
		-EXTENT + x * size,
		-EXTENT + row * size,
		-EXTENT + (x + 1) * size,
		-EXTENT + (row + 1) * size
	].join(',');
}

/**
 * Fill a tile URL template as MapLibre's `CanonicalTileID.url` does: `{z}` `{x}` `{y}` (flipped
 * for `scheme: 'tms'`), `{quadkey}`, `{bbox-epsg-3857}` and `{bbox}`, `{ratio}` (`@2x` above a pixel ratio of
 * 1) and `{prefix}`
 */
export function tileUrl(
	template: string,
	tile: TileCoord,
	pixelRatio: number,
	scheme?: string
): string {
	const y = scheme === 'tms' ? 2 ** tile.z - tile.y - 1 : tile.y;
	return (
		template
			.replace(/{prefix}/g, (tile.x % 16).toString(16) + (tile.y % 16).toString(16))
			.replace(/{z}/g, String(tile.z))
			.replace(/{x}/g, String(tile.x))
			.replace(/{y}/g, String(y))
			.replace(/{ratio}/g, pixelRatio > 1 ? '@2x' : '')
			.replace(/{quadkey}/g, quadkey(tile))
			.replace(/{bbox-epsg-3857}/g, () => bbox3857(tile))
			// MapLibre fills `{bbox}` in the tile matrix set of the source, EPSG:3857 by default
			.replace(/{bbox}/g, () => bbox3857(tile))
	);
}
