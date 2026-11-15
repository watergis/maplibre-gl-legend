import { rasterColorMatrix, rasterPlaceholder } from '../../assets/raster';
import {
	layerOpacity,
	opacity,
	uniqueId,
	type RenderContext,
	type RenderedSymbol
} from '../../render';
import type { SvgDocument } from '../../render/svg';
import type { EvaluatedLayer } from '../../style';
import { LayerAdapter } from '../base/layer-adapter';

/** The plain backdrop of a tile: a faint neutral, so that opacity fades towards the page */
const BACKDROP = 'rgba(128,128,128,0.12)';

/** An SVG filter of the shader's color adjustments, or undefined for the identity */
function colorFilter(svg: SvgDocument, paint: Record<string, unknown>) {
	const matrix = rasterColorMatrix(paint);
	if (!matrix) return undefined;
	const id = uniqueId('raster-filter');
	const element = svg.el('filter', { id, 'color-interpolation-filters': 'sRGB' }, [
		svg.el('feColorMatrix', {
			type: 'matrix',
			values: matrix.map((v) => +v.toFixed(6)).join(' ')
		})
	]);
	return { id, element };
}

/**
 * `raster`: a thumbnail of the layer. The tile at the center and zoom (or the image of an
 * image source) covers the swatch, clipped to it, with `raster-opacity` and the hue,
 * saturation, contrast and brightness of MapLibre's shader as one color matrix, over a plain
 * backdrop. The tile is used only when it loads (checked once per URL); when it does not, or
 * there is none, the generic mosaic stands in. Where loading cannot be checked (Node), the
 * tile is used. In an SVG shown through `<img>`, browsers do not load remote tiles at all.
 */
export class RasterAdapter extends LayerAdapter {
	readonly type = 'raster';

	async render(layer: EvaluatedLayer, ctx: RenderContext): Promise<RenderedSymbol> {
		const { width, height } = ctx.swatch;
		const swatch = ctx.createSwatch(width, height);
		const source = (layer.original as { source?: unknown }).source;
		const href = await ctx.raster.imageUrl(source);
		const loads = href ? await ctx.raster.loads(href) : false;
		if (!href || loads === false) {
			return swatch
				.add(rasterPlaceholder(ctx.document, width, height))
				.addFrame()
				.build();
		}
		const clip = uniqueId('clip');
		const filter = colorFilter(ctx.svg, layer.paint);
		return swatch
			.define(swatch.el('clipPath', { id: clip }, [swatch.el('rect', { width, height })]))
			.define(filter?.element)
			.add(swatch.el('rect', { x: 0, y: 0, width, height, fill: BACKDROP }))
			.add(
				swatch.el('image', {
					href,
					x: 0,
					y: 0,
					width,
					height,
					preserveAspectRatio: 'xMidYMid slice',
					'clip-path': `url(#${clip})`,
					opacity: opacity(layer.paint['raster-opacity'], layerOpacity(layer)),
					filter: filter ? `url(#${filter.id})` : undefined
				})
			)
			.addFrame()
			.build();
	}
}
