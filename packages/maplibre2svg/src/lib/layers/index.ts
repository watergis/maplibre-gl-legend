import type { EvaluatedLayer } from '../expression';
import { renderBackground } from './background';
import { renderCircle } from './circle';
import { widen } from './common';
import { renderDefault } from './default';
import { renderFill } from './fill';
import { renderFillExtrusion } from './fill-extrusion';
import { renderLine } from './line';
import { renderSymbolLayer } from './symbol';
import type { RenderContext, RenderedSymbol, Renderer } from './types';

export type { RenderContext, RenderedSymbol, Renderer } from './types';

/** The renderer of each layer type; the others get the neutral symbol */
export const RENDERERS: Record<string, Renderer> = {
	fill: renderFill,
	line: renderLine,
	circle: renderCircle,
	'fill-extrusion': renderFillExtrusion,
	background: renderBackground,
	symbol: renderSymbolLayer
};

/** Draw the symbol of one class with the renderer of its layer type */
export async function renderSymbol(
	layer: EvaluatedLayer,
	ctx: RenderContext
): Promise<RenderedSymbol> {
	return (RENDERERS[layer.type] ?? renderDefault)(layer, ctx);
}

/**
 * Draw the symbols of all classes of a layer. They share the widest width, with their
 * content centered, so that the labels after them line up.
 */
export async function renderSymbols(
	layers: EvaluatedLayer[],
	ctx: Omit<RenderContext, 'siblings'>
): Promise<RenderedSymbol[]> {
	const symbols = await Promise.all(
		layers.map((layer) => renderSymbol(layer, { ...ctx, siblings: layers }))
	);
	const width = Math.max(0, ...symbols.map((symbol) => symbol.width));
	return symbols.map((symbol) => widen(symbol, width));
}
