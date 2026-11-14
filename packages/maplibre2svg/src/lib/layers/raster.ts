import type { EvaluatedLayer } from '../expression';
import { imageLoads, rasterColorMatrix, rasterImageUrl, rasterPlaceholder } from '../raster';
import { el, uniqueId } from '../svg';
import { frame, layerOpacity, opacity, swatch } from './common';
import type { RenderContext, RenderedSymbol } from './types';

/** The plain backdrop of a tile: a faint neutral, so that opacity fades towards the page */
const BACKDROP = 'rgba(128,128,128,0.12)';

/** An SVG filter of the shader's color adjustments, or undefined for the identity */
function colorFilter(doc: Document, paint: Record<string, unknown>) {
	const matrix = rasterColorMatrix(paint);
	if (!matrix) return undefined;
	const id = uniqueId('raster-filter');
	const element = el(doc, 'filter', { id, 'color-interpolation-filters': 'sRGB' }, [
		el(doc, 'feColorMatrix', { type: 'matrix', values: matrix.map((v) => +v.toFixed(6)).join(' ') })
	]);
	return { id, element };
}

/**
 * A thumbnail of a raster layer: the tile at the center and zoom (or the image of an image
 * source) covering the swatch, clipped to it, with `raster-opacity` and the hue, saturation,
 * contrast and brightness of MapLibre's shader as one color matrix, over a plain backdrop.
 * The tile is used only when it loads (checked once per URL); when it does not, or there is
 * none, the generic mosaic stands in. Where loading cannot be checked (Node), the tile is used.
 * In an SVG shown through `<img>`, browsers do not load remote tiles at all.
 */
export async function renderRaster(
	layer: EvaluatedLayer,
	ctx: RenderContext
): Promise<RenderedSymbol> {
	const { width, height } = ctx.swatch;
	const doc = ctx.document;
	const source = (layer.original as { source?: unknown }).source;
	const href = await rasterImageUrl(source, ctx.raster);
	const loads = href ? await imageLoads(ctx.raster.cache, ctx.raster.loadImage, href) : false;
	const border = frame(ctx, width, height);
	if (!href || loads === false) {
		return swatch(ctx, width, height, [
			rasterPlaceholder(doc, width, height),
			...(border ? [border] : [])
		]);
	}
	const clip = uniqueId('clip');
	const filter = colorFilter(doc, layer.paint);
	const defs = el(doc, 'defs', {}, [
		el(doc, 'clipPath', { id: clip }, [el(doc, 'rect', { width, height })]),
		...(filter ? [filter.element] : [])
	]);
	const image = el(doc, 'image', {
		href,
		x: 0,
		y: 0,
		width,
		height,
		preserveAspectRatio: 'xMidYMid slice',
		'clip-path': `url(#${clip})`,
		opacity: opacity(layer.paint['raster-opacity'], layerOpacity(layer)),
		filter: filter ? `url(#${filter.id})` : undefined
	});
	const backdrop = el(doc, 'rect', { x: 0, y: 0, width, height, fill: BACKDROP });
	return swatch(ctx, width, height, [defs, backdrop, image, ...(border ? [border] : [])]);
}
