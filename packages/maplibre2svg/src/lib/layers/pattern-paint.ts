import { displaySize, findImage, imageUrl, patternOf } from '../images';
import type { RenderContext } from './types';

/** Size of one tile of a pattern, in CSS pixels */
export interface PatternTile {
	width: number;
	height: number;
	x?: number;
	y?: number;
}

/**
 * A paint of the image of `fill-pattern`, `line-pattern` and the like, tiled at its display
 * size or at the size `tile` gives. Undefined when the image is missing or cannot be encoded:
 * the renderer then paints the color instead.
 */
export async function patternPaint(
	ctx: RenderContext,
	name: unknown,
	tile?: (display: { width: number; height: number }) => PatternTile
): Promise<{ paint: string; defs: Element } | undefined> {
	const found = findImage(ctx.images, name);
	if (!found) return undefined;
	const href = await imageUrl(
		ctx.images.cache,
		ctx.images.encode,
		{ id: found.id, variant: 'plain' },
		found.image
	);
	if (!href) return undefined;
	const size: PatternTile = tile ? tile(displaySize(found.image)) : displaySize(found.image);
	const pattern = patternOf(ctx.document, href, size.width, size.height, size.x, size.y);
	return { paint: pattern.paint, defs: pattern.element };
}
