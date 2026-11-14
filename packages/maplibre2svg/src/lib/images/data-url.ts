import type { ImageEncoder, LegendCache, LegendImage } from '../types';
import { hasNoControls } from '../url-safety';

/** How many bytes the checksum of an image samples at most */
const CHECKSUM_SAMPLES = 1024;

/**
 * What tells one image from another under the same id: its size, pixel ratio, kind, and a
 * checksum of up to `CHECKSUM_SAMPLES` bytes spread over the data, so that an image replaced
 * under its id (`map.updateImage`, a new sprite) is encoded again
 */
export function imageFingerprint(image: LegendImage): string {
	const { data } = image;
	const step = Math.max(1, Math.floor(data.length / CHECKSUM_SAMPLES));
	let hash = 2166136261;
	for (let i = 0; i < data.length; i += step) {
		hash = Math.imul(hash ^ data[i], 16777619);
	}
	const kind = image.sdf ? 'sdf' : 'rgba';
	return `${image.width}x${image.height}@${image.pixelRatio}/${kind}/${data.length}/${(hash >>> 0).toString(36)}`;
}

/** Whether the encoder gave an image URL which can go into `href` */
export const isImageUrl = (url: unknown): url is string =>
	typeof url === 'string' &&
	hasNoControls(url) &&
	(url.startsWith('data:image/') || url.startsWith('blob:'));

/**
 * The URL of `width × height` RGBA pixels, encoded once per key and kept in the cache.
 * Undefined when the encoder cannot encode (such as without a canvas), throws, or gives
 * something other than a `data:image/` or `blob:` URL.
 */
export function encodedUrl(
	cache: LegendCache,
	encode: ImageEncoder,
	key: string,
	size: { width: number; height: number },
	pixels: () => Uint8ClampedArray
): Promise<string | undefined> {
	const cached = cache.store.get(key) as Promise<string | undefined> | undefined;
	if (cached) return cached;
	const url = (async () => {
		try {
			const result = await encode(pixels(), size.width, size.height);
			return isImageUrl(result) ? result : undefined;
		} catch {
			return undefined;
		}
	})();
	cache.store.set(key, url);
	return url;
}

/**
 * The URL of an image of the style, or of a variant of it (such as a tint, given with its
 * own pixels and size), encoded once per image content and variant
 */
export function imageUrl(
	cache: LegendCache,
	encode: ImageEncoder,
	key: { id: string; variant: string },
	image: LegendImage,
	pixels: () => Uint8ClampedArray = () => new Uint8ClampedArray(image.data),
	size: { width: number; height: number } = image
): Promise<string | undefined> {
	const cacheKey = `image|${key.id}|${imageFingerprint(image)}|${key.variant}|${size.width}x${size.height}`;
	return encodedUrl(cache, encode, cacheKey, size, pixels);
}
