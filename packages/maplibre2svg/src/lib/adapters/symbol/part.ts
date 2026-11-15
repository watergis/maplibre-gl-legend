import { el, type RenderContext } from '../../render';
import type { EvaluatedLayer } from '../../style';

/** A part of a symbol, such as the icon or the text, drawn from (0, 0) */
export interface SymbolPart {
	nodes: Element[];
	defs: Element[];
	width: number;
	height: number;
}

/** Draws one part of the symbol of a symbol layer, such as the icon or the label */
export interface SymbolPartDrawer {
	/** The part, or undefined when the layer does not draw it */
	draw(layer: EvaluatedLayer, ctx: RenderContext): Promise<SymbolPart | undefined>;
}

/**
 * A neutral stand-in of the size, for an icon whose image is missing or cannot be encoded:
 * a translucent grey square with a dot, which reads on light and dark pages
 */
export function placeholderPart(doc: Document, width: number, height: number): SymbolPart {
	const r = Math.max(1, Math.min(width, height) / 5);
	return {
		nodes: [
			el(doc, 'rect', {
				x: 0.5,
				y: 0.5,
				width: Math.max(1, width - 1),
				height: Math.max(1, height - 1),
				rx: 2,
				fill: 'rgba(128,128,128,0.2)',
				stroke: 'rgba(128,128,128,0.7)',
				'stroke-width': 1
			}),
			el(doc, 'circle', { cx: width / 2, cy: height / 2, r, fill: 'rgba(128,128,128,0.7)' })
		],
		defs: [],
		width,
		height
	};
}
