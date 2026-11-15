import type { LegendCache } from '../../core/types';
import { decodeGlyphs, type Glyph } from './decode';

/** Gets the bytes of a glyph PBF; the host can route the requests through its own */
export type GlyphFetcher = (url: string) => Promise<ArrayBuffer>;

export const defaultFetchGlyphs: GlyphFetcher = async (url) => {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`glyphs: ${response.status} ${url}`);
	return response.arrayBuffer();
};

/**
 * The glyphs of one range, loaded once per URL and kept in the cache, failures too, so that a
 * missing font is not requested again on every update. Concurrent calls share one request.
 * Undefined when the range cannot be loaded or decoded.
 */
export function loadGlyphRange(
	cache: LegendCache,
	fetchGlyphs: GlyphFetcher,
	url: string
): Promise<Map<number, Glyph> | undefined> {
	return cache.memo(`glyphs|${url}`, async () => {
		try {
			return decodeGlyphs(await fetchGlyphs(url));
		} catch {
			return undefined;
		}
	});
}
