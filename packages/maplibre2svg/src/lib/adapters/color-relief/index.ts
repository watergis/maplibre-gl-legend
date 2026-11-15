import type { RenderContext, RenderedSymbol } from '../../render';
import type { EvaluatedLayer } from '../../style';
import { AreaAdapter } from '../base/area';
import { neutralSymbol } from '../default';

/**
 * `color-relief`, classified by `elevation`: one area swatch per class of the color of its
 * elevation (a stop of an `interpolate`, an interval of a `step`), with `color-relief-opacity`
 * and the neutral frame. Without a class, the color has no single value: the neutral symbol.
 */
export class ColorReliefAdapter extends AreaAdapter {
	readonly type = 'color-relief';
	readonly classificationAxes = [['paint', 'color-relief-color']] as const;
	readonly classifyingInputs: ReadonlySet<string> = new Set(['elevation']);
	protected readonly colorProperty = 'color-relief-color';
	protected readonly opacityProperty = 'color-relief-opacity';

	override async render(layer: EvaluatedLayer, ctx: RenderContext): Promise<RenderedSymbol> {
		if (layer.paint[this.colorProperty] === undefined) return neutralSymbol(ctx);
		return super.render(layer, ctx);
	}
}
