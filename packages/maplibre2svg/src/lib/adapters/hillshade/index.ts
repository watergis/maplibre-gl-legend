import type { RenderContext, RenderedSymbol } from '../../render';
import type { EvaluatedLayer } from '../../style';
import { toRgba } from '../../util/color';
import { clamp, numberOf } from '../../util/number';
import { LayerAdapter } from '../base/layer-adapter';
import { shadeTerrain, type HillshadeLight, type Premultiplied } from './shade';
import { vectorHillshade } from './vector';

export { standardHillshade, terrainDerivative, terrainHeight, type HillshadeLight } from './shade';
export { facetLight, vectorHillshade } from './vector';

/** Default of `hillshade-illumination-direction` */
const DEFAULT_DIRECTION = 335;
/** The ground beneath the relief, so that the highlights show on a white page */
const GROUND = 'rgba(128,128,128,0.22)';

/** The first entry of a value which newer specifications allow to be an array */
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const premultiplied = (value: unknown, fallback: string): Premultiplied => {
	const [r, g, b, a] = toRgba(value ?? fallback);
	return [r * a, g * a, b * a, a];
};

/** The light and colors of the layer, the first of arrays */
export function standardHillshadeLight(layer: EvaluatedLayer): HillshadeLight {
	return {
		direction: numberOf(first(layer.paint['hillshade-illumination-direction']), DEFAULT_DIRECTION),
		exaggeration: clamp(numberOf(layer.paint['hillshade-exaggeration'], 0.5), 0, 1),
		highlight: premultiplied(first(layer.paint['hillshade-highlight-color']), '#ffffff'),
		shadow: premultiplied(first(layer.paint['hillshade-shadow-color']), '#000000'),
		accent: premultiplied(layer.paint['hillshade-accent-color'], '#000000')
	};
}

/**
 * `hillshade`: a small synthetic range of hills shaded with MapLibre's standard hillshade
 * shader (`hillshade-illumination-direction`, `-exaggeration`, `-highlight-color`,
 * `-shadow-color`, `-accent-color`; the first of arrays; every `hillshade-method` drawn as the
 * standard one), over a neutral ground, as an image at the output pixel ratio. Where no image
 * can be encoded (Node), a vector stand-in.
 */
export class HillshadeAdapter extends LayerAdapter {
	readonly type = 'hillshade';

	async render(layer: EvaluatedLayer, ctx: RenderContext): Promise<RenderedSymbol> {
		const { width, height } = ctx.swatch;
		const light = standardHillshadeLight(layer);
		const [w, h] = [Math.round(width * ctx.pixelRatio), Math.round(height * ctx.pixelRatio)];
		const key = `hillshade|${JSON.stringify(light)}|${w}x${h}|${width}x${height}`;
		const href = await ctx.images.encoded(key, { width: w, height: h }, () =>
			shadeTerrain(w, h, width, height, light)
		);
		if (!href) return vectorHillshade(layer, ctx);
		const swatch = ctx.createSwatch(width, height);
		return swatch
			.add(swatch.el('rect', { x: 0, y: 0, width, height, fill: GROUND }))
			.add(swatch.el('image', { href, x: 0, y: 0, width, height, preserveAspectRatio: 'none' }))
			.addFrame()
			.build();
	}
}
