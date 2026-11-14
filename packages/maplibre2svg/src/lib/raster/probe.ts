import type { LegendCache } from '../types';

/** Whether the image at a URL loads in the browser */
export type ImageLoader = (url: string) => Promise<boolean>;

/** How long a tile may take to load before the placeholder is shown */
const TIMEOUT = 4000;

/**
 * Load images with the `Image` of the document's window, without `crossOrigin` (only whether it
 * loads matters, not its pixels). Undefined where there is no `Image`, such as in Node.
 */
export function defaultImageLoader(doc: Document): ImageLoader | undefined {
	const ImageClass = doc.defaultView?.Image;
	if (typeof ImageClass !== 'function') return undefined;
	return (url) =>
		new Promise((resolve) => {
			const image = new ImageClass();
			const timer = setTimeout(() => resolve(false), TIMEOUT);
			image.onload = () => {
				clearTimeout(timer);
				resolve(true);
			};
			image.onerror = () => {
				clearTimeout(timer);
				resolve(false);
			};
			image.src = url;
		});
}

/**
 * Whether the image at a URL loads, checked once per URL and kept in the cache (successes and
 * failures). Undefined when it cannot be told (no loader): the image is then used as it is.
 */
export function imageLoads(
	cache: LegendCache,
	loader: ImageLoader | undefined,
	url: string
): Promise<boolean | undefined> {
	if (!loader) return Promise.resolve(undefined);
	const key = `image-loads|${url}`;
	const cached = cache.store.get(key) as Promise<boolean> | undefined;
	if (cached) return cached;
	const result = loader(url).then(
		(loads) => loads === true,
		() => false
	);
	cache.store.set(key, result);
	return result;
}
