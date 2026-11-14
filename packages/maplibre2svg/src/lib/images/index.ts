import type { ImageEncoder, LegendCache, LegendImage } from '../types';
import { matchTemplate } from './match';

export { imageUrl } from './data-url';
export { matchTemplate } from './match';
export { patternOf } from './pattern';
export { tintSdf, sdfThresholds, type Rgba, type SdfTint } from './sdf-icon';

/** Where images come from, and how they are encoded */
export interface ImageContext {
	getImage?: (id: string) => LegendImage | undefined;
	listImages?: () => string[];
	encode: ImageEncoder;
	cache: LegendCache;
}

/** An image of the style with its id */
export interface FoundImage {
	id: string;
	image: LegendImage;
}

function isValid(image: LegendImage | undefined): image is LegendImage {
	if (!image || !image.data) return false;
	const { width, height } = image;
	return (
		Number.isInteger(width) &&
		Number.isInteger(height) &&
		width > 0 &&
		height > 0 &&
		image.data.length >= width * height * 4
	);
}

/** An image by its id, or undefined when there is none or it is not RGBA of its size */
export function findImage(images: ImageContext, id: unknown): FoundImage | undefined {
	if (typeof id !== 'string' || id === '' || !images.getImage) return undefined;
	try {
		const image = images.getImage(id);
		if (!isValid(image)) return undefined;
		const pixelRatio = image.pixelRatio > 0 ? image.pixelRatio : 1;
		return { id, image: { ...image, pixelRatio, sdf: image.sdf === true } };
	} catch {
		return undefined;
	}
}

/**
 * An image which a `{token}` template stands for, chosen among the images there are, since the
 * legend has no feature to fill the tokens with
 */
export function findImageByTemplate(
	images: ImageContext,
	template: string
): FoundImage | undefined {
	let ids: string[];
	try {
		ids = images.listImages?.() ?? [];
	} catch {
		return undefined;
	}
	const available = ids.filter((id) => findImage(images, id));
	const id = matchTemplate(template, available);
	return id === undefined ? undefined : findImage(images, id);
}

/** Display size of an image in CSS pixels */
export const displaySize = (image: LegendImage) => ({
	width: image.width / image.pixelRatio,
	height: image.height / image.pixelRatio
});
