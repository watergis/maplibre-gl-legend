import type { EvaluatedLayer } from '../../expression';
import { el } from '../../svg';
import type { RenderContext } from '../types';
import type { SymbolPart } from './part';

/** Whether the layer draws a label */
export function hasText(layer: EvaluatedLayer) {
	const text = layer.layout['text-field'];
	return (
		layer.unresolvedTokens['text-field'] !== undefined ||
		(typeof text === 'string' && text.trim() !== '')
	);
}

/**
 * A neutral stand-in for the label: "Aa" in grey. The label is drawn with the glyphs of the
 * style in a later step. Undefined when the layer has no `text-field`.
 */
export function textPart(layer: EvaluatedLayer, ctx: RenderContext): SymbolPart | undefined {
	if (!hasText(layer)) return undefined;
	const [width, height] = [18, 14];
	const text = el(ctx.document, 'text', {
		x: width / 2,
		y: height - 3,
		'text-anchor': 'middle',
		'font-family': 'sans-serif',
		'font-size': 12,
		fill: 'rgba(128,128,128,0.9)'
	});
	text.textContent = 'Aa';
	return { nodes: [text], defs: [], width, height };
}
