import type { ImageEncoder, LegendCache, LegendImage } from '../types';

/**
 * The URL of an image, encoded once per image id and variant (such as a tint) and kept in
 * the cache. Undefined when the encoder cannot encode, such as without a canvas.
 */
export function imageUrl(
	cache: LegendCache,
	encode: ImageEncoder,
	key: { id: string; variant: string },
	image: LegendImage,
	pixels: () => Uint8ClampedArray = () => new Uint8ClampedArray(image.data)
): Promise<string | undefined> {
	const cacheKey = `image|${key.id}|${key.variant}`;
	const cached = cache.store.get(cacheKey) as Promise<string | undefined> | undefined;
	if (cached) return cached;
	const url = (async () => {
		try {
			return (await encode(pixels(), image.width, image.height)) || undefined;
		} catch {
			return undefined;
		}
	})();
	cache.store.set(cacheKey, url);
	return url;
}
