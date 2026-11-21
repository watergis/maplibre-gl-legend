import { fmt, type RenderContext, type RenderedSymbol } from '../../render';
import type { EvaluatedLayer } from '../../style';
import { neutralSymbol } from '../default';
import { LayerAdapter } from '../base/layer-adapter';
import { IconDrawer } from './icon';
import type { SymbolPartDrawer } from './part';
import { TextDrawer } from './text';

export { hasIcon, iconSize, IconDrawer, rotatedBox } from './icon';
export {
	MISSING_ICON_CLASS,
	placeholderPart,
	type SymbolPart,
	type SymbolPartDrawer
} from './part';
export { hasText, TextDrawer } from './text';

/** Space between the icon and the text */
const GAP = 4;

/**
 * `symbol`: the icon, or a sample of the label when the layer has no icon, centered in the
 * swatch, which grows to fit it. A layer with neither gets the neutral symbol.
 */
export class SymbolAdapter extends LayerAdapter {
	readonly type = 'symbol';
	readonly geometryType = 'Point';
	readonly classificationAxes = [
		['layout', 'icon-image'],
		['paint', 'icon-color'],
		['paint', 'text-color'],
		['layout', 'icon-size'],
		['layout', 'text-size']
	] as const;

	/**
	 * The candidate parts of the symbol, in order of priority: the first one the layer draws is
	 * the symbol, so the label is drawn only for a layer without an icon
	 */
	protected readonly parts: readonly SymbolPartDrawer[] = [new IconDrawer(), new TextDrawer()];

	async render(layer: EvaluatedLayer, ctx: RenderContext): Promise<RenderedSymbol> {
		const parts = [];
		for (const drawer of this.parts) {
			const part = await drawer.draw(layer, ctx);
			if (part) {
				parts.push(part);
				break;
			}
		}
		if (parts.length === 0) return neutralSymbol(ctx);
		const contentWidth = parts.reduce((sum, p) => sum + p.width, 0) + GAP * (parts.length - 1);
		const contentHeight = Math.max(...parts.map((p) => p.height));
		const width = Math.max(ctx.swatch.width, Math.ceil(contentWidth) + 2);
		const height = Math.max(ctx.swatch.height, Math.ceil(contentHeight) + 2);
		const swatch = ctx.createSwatch(width, height);
		let x = (width - contentWidth) / 2;
		for (const part of parts) {
			const y = (height - part.height) / 2;
			swatch.define(...part.defs);
			swatch.add(swatch.el('g', { transform: `translate(${fmt(x)} ${fmt(y)})` }, part.nodes));
			x += part.width + GAP;
		}
		return swatch.build();
	}
}
