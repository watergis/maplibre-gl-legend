import { sampleText } from '../../assets/glyphs';
import { el, layerOpacity, opacity, paintColor, type RenderContext } from '../../render';
import type { EvaluatedLayer } from '../../style';
import { toRgba } from '../../util/color';
import { clamp, numberOf } from '../../util/number';
import { cssTextPart, type TextLook } from './css-text';
import type { SymbolPart, SymbolPartDrawer } from './part';

/**
 * Whether the layer draws a label: it sets `text-field` (a constant, `{tokens}` or an
 * expression, which may give no text for the legend's feature; the sample is used then)
 */
export function hasText(layer: EvaluatedLayer) {
	const layout = (layer.original as { layout?: Record<string, unknown> }).layout;
	const raw = layout?.['text-field'];
	return raw !== undefined && raw !== null && raw !== '';
}

const fontStackOf = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((font): font is string => typeof font === 'string') : [];

/** The sample text and how it looks, from the evaluated layer */
function lookOf(layer: EvaluatedLayer, ctx: RenderContext): TextLook {
	const haloWidth = Math.max(0, numberOf(layer.paint['text-halo-width'], 0));
	return {
		text: sampleText(
			layer.layout['text-field'],
			layer.layout['text-transform'],
			ctx.text.sampleText
		),
		fontStack: fontStackOf(layer.layout['text-font']),
		size: clamp(numberOf(layer.layout['text-size'], 16), 1, ctx.swatch.maxSize),
		letterSpacing: numberOf(layer.layout['text-letter-spacing'], 0),
		color: paintColor(layer.paint['text-color']),
		halo: { ...paintColor(layer.paint['text-halo-color']), width: haloWidth }
	};
}

/** The label drawn from the glyphs of the style, or undefined to fall back to a CSS font */
async function glyphPart(layer: EvaluatedLayer, ctx: RenderContext, look: TextLook) {
	const glyphs = ctx.text.glyphs;
	const fontStack = look.fontStack as string[];
	if (!glyphs || fontStack.length === 0) return undefined;
	const image = await glyphs.render({
		text: look.text,
		fontStack,
		textSize: look.size,
		letterSpacing: look.letterSpacing,
		style: {
			color: toRgba(layer.paint['text-color']),
			haloColor: toRgba(layer.paint['text-halo-color']),
			haloWidth: look.halo.width,
			haloBlur: Math.max(0, numberOf(layer.paint['text-halo-blur'], 0))
		},
		maxSize: ctx.swatch.maxSize
	});
	if (!image) return undefined;
	const node = el(ctx.document, 'image', {
		href: image.href,
		x: 0,
		y: 0,
		width: image.width,
		height: image.height,
		preserveAspectRatio: 'none'
	});
	return { nodes: [node], defs: [], width: image.width, height: image.height };
}

/**
 * A sample of the label: the glyphs of the style when it has `glyphs` and they load, else
 * SVG text in a CSS font, with `text-opacity`. Nothing when the layer has no `text-field`.
 */
export class TextDrawer implements SymbolPartDrawer {
	async draw(layer: EvaluatedLayer, ctx: RenderContext): Promise<SymbolPart | undefined> {
		return hasText(layer) ? textPart(layer, ctx) : undefined;
	}
}

async function textPart(layer: EvaluatedLayer, ctx: RenderContext): Promise<SymbolPart> {
	const look = lookOf(layer, ctx);
	const part =
		(await glyphPart(layer, ctx, look)) ?? cssTextPart(ctx.document, look, ctx.text.measure);
	const group = el(
		ctx.document,
		'g',
		{ opacity: opacity(layer.paint['text-opacity'], layerOpacity(layer)) },
		part.nodes
	);
	return { ...part, nodes: [group] };
}
