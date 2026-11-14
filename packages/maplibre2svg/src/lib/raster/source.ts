import { isLoadableUrl } from './url';
import type { LegendCache } from '../types';
import type { ImageLoader } from './probe';
import { tileFor, tileUrl, type TileSourceInfo } from './tile';

/** Maps a tile or image URL of a source, e.g. a custom protocol, to one the browser can load */
export type RasterUrlResolver = (
	url: string,
	source: unknown
) => string | undefined | Promise<string | undefined>;

/** Where the thumbnail of a raster layer comes from */
export interface RasterContext {
	/** the sources of the style, with the host's `sources` over them */
	sources: Record<string, unknown>;
	center: [number, number];
	zoom: number;
	pixelRatio: number;
	resolveUrl?: RasterUrlResolver;
	/** checks that a tile loads; undefined where that cannot be told */
	loadImage?: ImageLoader;
	cache: LegendCache;
}

type SourceLike = TileSourceInfo & { type?: string; tiles?: unknown; url?: unknown };

/**
 * The URL of the image of a source, before validation: the tile of a `raster` source at the
 * center and zoom, the `url` of an `image` source. Undefined for the kinds the legend cannot
 * show (`canvas`, `video`, `raster-dem`, a TileJSON `url` without `tiles`).
 */
export function sourceImageUrl(source: unknown, ctx: RasterContext): string | undefined {
	if (!source || typeof source !== 'object') return undefined;
	const s = source as SourceLike;
	if (s.type === 'image') return typeof s.url === 'string' ? s.url : undefined;
	if (s.type !== 'raster') return undefined;
	const template = Array.isArray(s.tiles) ? s.tiles[0] : undefined;
	if (typeof template !== 'string') return undefined;
	return tileUrl(template, tileFor(ctx.center, ctx.zoom, s), ctx.pixelRatio, s.scheme);
}

/**
 * The URL of the thumbnail of a raster layer on the source id: the source's image URL, mapped
 * by the host's `resolveRasterUrl` (undefined there keeps the URL as it is), when it is one
 * that can go into `<image href>`. Undefined otherwise: the placeholder is shown.
 */
export async function rasterImageUrl(
	sourceId: unknown,
	ctx: RasterContext
): Promise<string | undefined> {
	if (typeof sourceId !== 'string') return undefined;
	const source = ctx.sources[sourceId];
	const url = sourceImageUrl(source, ctx);
	if (url === undefined) return undefined;
	let resolved: unknown;
	try {
		resolved = (ctx.resolveUrl ? await ctx.resolveUrl(url, source) : undefined) ?? url;
	} catch {
		return undefined;
	}
	return isLoadableUrl(resolved) ? resolved : undefined;
}
