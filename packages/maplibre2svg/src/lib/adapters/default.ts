import type { RenderContext, RenderedSymbol } from '../render';
import type { EvaluatedLayer } from '../style';
import { LayerAdapter } from './layer-adapter';

/** A grey rectangle the size of the swatch, for what has no symbol of its own */
export function neutralSymbol(ctx: RenderContext): RenderedSymbol {
	const { width, height } = ctx.swatch;
	const swatch = ctx.createSwatch(width, height);
	return swatch
		.add(swatch.insetRect({ fill: '#cccccc', stroke: '#999999', 'stroke-width': 1 }))
		.build();
}

/** The adapter of the layer types which have none of their own: the neutral symbol */
export class DefaultAdapter extends LayerAdapter {
	readonly type: string;

	constructor(type = '*') {
		super();
		this.type = type;
	}

	render(_layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
		return neutralSymbol(ctx);
	}
}
