import type { EvaluatedLayer } from '../../expression';
import { el, fmt } from '../../svg';
import { swatch } from '../common';
import { renderDefault } from '../default';
import type { RenderContext, RenderedSymbol } from '../types';
import { iconPart } from './icon';
import { textPart } from './text';

/** Space between the icon and the text */
const GAP = 4;

/**
 * A symbol layer: the icon, then the text beside it, centered in the swatch, which grows to
 * fit them. A layer with neither gets the neutral symbol.
 */
export async function renderSymbolLayer(
	layer: EvaluatedLayer,
	ctx: RenderContext
): Promise<RenderedSymbol> {
	const parts = [await iconPart(layer, ctx), textPart(layer, ctx)].filter((p) => p !== undefined);
	if (parts.length === 0) return renderDefault(layer, ctx);
	const contentWidth = parts.reduce((sum, p) => sum + p.width, 0) + GAP * (parts.length - 1);
	const contentHeight = Math.max(...parts.map((p) => p.height));
	const width = Math.max(ctx.swatch.width, Math.ceil(contentWidth) + 2);
	const height = Math.max(ctx.swatch.height, Math.ceil(contentHeight) + 2);
	let x = (width - contentWidth) / 2;
	const groups = parts.map((part) => {
		const y = (height - part.height) / 2;
		const group = el(
			ctx.document,
			'g',
			{ transform: `translate(${fmt(x)} ${fmt(y)})` },
			part.nodes
		);
		x += part.width + GAP;
		return group;
	});
	const defs = parts.flatMap((p) => p.defs);
	return swatch(ctx, width, height, [
		...(defs.length ? [el(ctx.document, 'defs', {}, defs)] : []),
		...groups
	]);
}
