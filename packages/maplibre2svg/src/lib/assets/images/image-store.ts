import type { LegendCache } from '../../core/cache';
import type { ImageEncoder, LegendImage } from '../../core/types';
import { encodedUrl, imageUrl } from './data-url';
import { findImage, findImageByTemplate, type FoundImage, type ImageContext } from './find';

/** The size of an image, in pixels */
export interface ImageSize {
	width: number;
	height: number;
}

/**
 * The images of the style, and how they are encoded into URLs: finds an image by its id or
 * by a `{token}` template, and encodes it (or a variant of it, such as a tint) once per content
 */
export class ImageStore implements ImageContext {
	readonly getImage?: (id: string) => LegendImage | undefined;
	readonly listImages?: () => string[];
	readonly encode: ImageEncoder;
	readonly cache: LegendCache;

	constructor(init: ImageContext) {
		this.getImage = init.getImage;
		this.listImages = init.listImages;
		this.encode = init.encode;
		this.cache = init.cache;
	}

	/** An image by its id, or undefined when there is none or it is not RGBA of its size */
	find(id: unknown): FoundImage | undefined {
		return findImage(this, id);
	}

	/** An image which a `{token}` template stands for; see `findImageByTemplate` */
	findByTemplate(template: string, hint = ''): FoundImage | undefined {
		return findImageByTemplate(this, template, hint);
	}

	/**
	 * The URL of an image, or of a variant of it given with its own pixels and size. Undefined
	 * when it cannot be encoded.
	 */
	url(
		found: FoundImage,
		variant = 'plain',
		pixels?: () => Uint8ClampedArray,
		size?: ImageSize
	): Promise<string | undefined> {
		return imageUrl(this.cache, this.encode, { id: found.id, variant }, found.image, pixels, size);
	}

	/** The URL of pixels drawn by the legend itself, encoded once per key */
	encoded(key: string, size: ImageSize, pixels: () => Uint8ClampedArray) {
		return encodedUrl(this.cache, this.encode, key, size, pixels);
	}
}
