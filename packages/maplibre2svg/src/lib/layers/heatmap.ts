import type { EvaluatedLayer } from '../expression';
import { renderRamp } from './ramp';
import type { RenderContext, RenderedSymbol } from './types';

/** `heatmap-color` over `heatmap-density` 0 → 1 (the default ramp when unset), `heatmap-opacity` */
export function renderHeatmap(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	return renderRamp(
		layer,
		ctx,
		{ name: 'heatmap-color', input: 'heatmap-density', global: 'heatmapDensity', domain: [0, 1] },
		'heatmap-opacity'
	);
}
