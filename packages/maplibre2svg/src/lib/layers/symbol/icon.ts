import { toRgba } from '../../color';
import type { EvaluatedLayer } from '../../expression';
import {
	displaySize,
	findImage,
	findImageByTemplate,
	imageUrl,
	tintSdf,
	type FoundImage
} from '../../images';
import { el } from '../../svg';
import { layerOpacity, numberOf, opacity } from '../common';
import type { RenderContext } from '../types';
import { placeholderPart, type SymbolPart } from './part';

/** Size of the stand-in of a missing image, in CSS pixels at `icon-size` 1 */
const PLACEHOLDER_SIZE = 14;

/** The image of `icon-image`, or of the `{token}` template the legend could not fill */
function iconImage(layer: EvaluatedLayer, ctx: RenderContext): FoundImage | undefined {
	const template = layer.unresolvedTokens['icon-image']?.template;
	if (template !== undefined) return findImageByTemplate(ctx.images, template);
	return findImage(ctx.images, layer.layout['icon-image']);
}

/** Whether the layer draws an icon at all */
export function hasIcon(layer: EvaluatedLayer) {
	const name = layer.layout['icon-image'];
	return (
		layer.unresolvedTokens['icon-image'] !== undefined || (typeof name === 'string' && name !== '')
	);
}

/** Display size of the icon: the image size × `icon-size`, scaled down to fit `maxSize` */
export function iconSize(width: number, height: number, iconScale: number, maxSize: number) {
	const w = width * iconScale;
	const h = height * iconScale;
	const fit = Math.max(w, h) > maxSize ? maxSize / Math.max(w, h) : 1;
	return { width: w * fit, height: h * fit };
}

/** Bounding box of a `width × height` rectangle rotated by `degrees` */
export function rotatedBox(width: number, height: number, degrees: number) {
	const rad = (degrees * Math.PI) / 180;
	const [c, s] = [Math.abs(Math.cos(rad)), Math.abs(Math.sin(rad))];
	return { width: width * c + height * s, height: width * s + height * c };
}

/** The URL of the image: an SDF image tinted with `icon-color` and the halo */
function iconUrl(layer: EvaluatedLayer, ctx: RenderContext, found: FoundImage, scale: number) {
	const { cache, encode } = ctx.images;
	if (!found.image.sdf)
		return imageUrl(cache, encode, { id: found.id, variant: 'plain' }, found.image);
	const tint = {
		color: toRgba(layer.paint['icon-color']),
		haloColor: toRgba(layer.paint['icon-halo-color']),
		haloWidth: Math.max(0, numberOf(layer.paint['icon-halo-width'], 0)),
		haloBlur: Math.max(0, numberOf(layer.paint['icon-halo-blur'], 0)),
		size: scale
	};
	const variant = `sdf|${JSON.stringify(tint)}`;
	return imageUrl(cache, encode, { id: found.id, variant }, found.image, () =>
		tintSdf(found.image, tint)
	);
}

/**
 * The icon of a symbol layer at its real display size, `(width / pixelRatio) × icon-size`,
 * scaled down to fit `maxSize`, rotated by `icon-rotate`, with `icon-opacity`. An SDF image is
 * tinted with `icon-color` and its halo. A missing image gives a neutral stand-in. Undefined
 * when the layer has no `icon-image`.
 */
export async function iconPart(
	layer: EvaluatedLayer,
	ctx: RenderContext
): Promise<SymbolPart | undefined> {
	if (!hasIcon(layer)) return undefined;
	const doc = ctx.document;
	const scale = Math.max(0, numberOf(layer.layout['icon-size'], 1));
	const found = iconImage(layer, ctx);
	const base = found
		? displaySize(found.image)
		: { width: PLACEHOLDER_SIZE, height: PLACEHOLDER_SIZE };
	const size = iconSize(base.width, base.height, scale, ctx.swatch.maxSize);
	const href = found ? await iconUrl(layer, ctx, found, scale) : undefined;
	const content = href
		? [
				el(doc, 'image', {
					href,
					x: 0,
					y: 0,
					width: size.width,
					height: size.height,
					preserveAspectRatio: 'none'
				})
			]
		: placeholderPart(doc, size.width, size.height).nodes;

	const rotate = numberOf(layer.layout['icon-rotate'], 0) % 360;
	const box = rotatedBox(size.width, size.height, rotate);
	const transform =
		`translate(${box.width / 2} ${box.height / 2})` +
		(rotate ? ` rotate(${rotate})` : '') +
		` translate(${-size.width / 2} ${-size.height / 2})`;
	const group = el(
		doc,
		'g',
		{ transform, opacity: opacity(layer.paint['icon-opacity'], layerOpacity(layer)) },
		content
	);
	return { nodes: [group], defs: [], width: box.width, height: box.height };
}
