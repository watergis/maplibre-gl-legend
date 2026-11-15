import {
	layerOpacity,
	opacity,
	paintColor,
	type RenderContext,
	type RenderedSymbol,
	type Swatch
} from '../render';
import type { Attrs } from '../render/svg';
import type { EvaluatedLayer } from '../style';
import { LayerAdapter } from './layer-adapter';

/** The fill of an area: its attributes and the `<pattern>` they refer to, if any */
export interface AreaPaint {
	attrs: { fill: string; 'fill-opacity': number };
	defs?: Element;
}

/**
 * The base of the layer types drawn as a filled rectangle the size of the swatch, with the
 * neutral frame around it: `fill`, `background` and `color-relief`. A subclass names its
 * paint properties and draws the rectangle.
 */
export abstract class AreaAdapter extends LayerAdapter {
	/** e.g. `fill-color` */
	protected abstract readonly colorProperty: string;
	/** e.g. `fill-opacity` */
	protected abstract readonly opacityProperty: string;
	/** e.g. `fill-pattern`; undefined when the type has none */
	protected readonly patternProperty?: string;

	/** The opacity of the area: its opacity property × the opacity of the layer */
	protected alpha(layer: EvaluatedLayer): number {
		return opacity(layer.paint[this.opacityProperty]) * layerOpacity(layer);
	}

	/** The paint of the area: the image of the pattern when there is one, else the color */
	protected async paint(
		layer: EvaluatedLayer,
		ctx: RenderContext,
		alpha: number
	): Promise<AreaPaint> {
		const pattern = this.patternProperty
			? await ctx.pattern(layer.paint[this.patternProperty])
			: undefined;
		if (pattern)
			return { attrs: { fill: pattern.paint, 'fill-opacity': alpha }, defs: pattern.defs };
		const color = paintColor(layer.paint[this.colorProperty], alpha);
		return { attrs: { fill: color.color, 'fill-opacity': color.opacity } };
	}

	/** The rectangle of the area */
	protected shape(_layer: EvaluatedLayer, swatch: Swatch, fill: Attrs): Element {
		return swatch.insetRect(fill);
	}

	/** Whether the neutral frame goes around the area */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- subclasses decide by the layer
	protected framed(layer: EvaluatedLayer): boolean {
		return true;
	}

	async render(layer: EvaluatedLayer, ctx: RenderContext): Promise<RenderedSymbol> {
		const swatch = ctx.createSwatch(ctx.swatch.width, ctx.swatch.height);
		const paint = await this.paint(layer, ctx, this.alpha(layer));
		swatch.define(paint.defs).add(this.shape(layer, swatch, paint.attrs));
		if (this.framed(layer)) swatch.addFrame();
		return swatch.build();
	}
}
