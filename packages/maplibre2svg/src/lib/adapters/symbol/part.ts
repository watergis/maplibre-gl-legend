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

/** CSS class of the placeholder of an icon */
export const MISSING_ICON_CLASS = 'maplibre2svg-missing-icon';

/** Stroke of the placeholder, unless `--maplibre2svg-missing-icon-color` sets another */
const MISSING_ICON_COLOR = '#888888';

const XHTML_NS = 'http://www.w3.org/1999/xhtml';

/** The image of `--maplibre2svg-missing-icon` as a mask, filled with the color of the icon */
const CUSTOM_ICON_STYLE = [
	'display: block',
	'width: 100%',
	'height: 100%',
	`background-color: var(--maplibre2svg-missing-icon-color, ${MISSING_ICON_COLOR})`,
	'-webkit-mask: var(--maplibre2svg-missing-icon) center / contain no-repeat',
	'mask: var(--maplibre2svg-missing-icon) center / contain no-repeat'
].join('; ');

/**
 * A stand-in of the size for an icon which cannot be shown: its image is missing or cannot be
 * encoded, or `icon-image` gives no image without a feature (`["get", "icon"]`).
 *
 * A `<g class="maplibre2svg-missing-icon">` with two children:
 * - `.maplibre2svg-missing-icon-default`: a square with an exclamation mark (the shape of Lucide's
 *   `square-exclamation-point`) drawn in SVG, so that it shows without CSS too. Its stroke and fill
 *   are `--maplibre2svg-missing-icon-color` (`#888888`) and `--maplibre2svg-missing-icon-fill`
 *   (`none`).
 * - `.maplibre2svg-missing-icon-custom`: hidden by default, a `<foreignObject>` filled with
 *   `--maplibre2svg-missing-icon-color` through the mask `--maplibre2svg-missing-icon`, such as
 *   `url("data:image/svg+xml,…")`. A page shows it in place of the default to use an icon of its own.
 */
export function placeholderPart(doc: Document, width: number, height: number): SymbolPart {
	const m = Math.min(width, height);
	const stroke = Math.max(1, m / 9);
	const cx = width / 2;
	const cy = height / 2;
	const inset = stroke / 2;
	const shape = el(
		doc,
		'g',
		{
			class: `${MISSING_ICON_CLASS}-default`,
			fill: 'none',
			stroke: MISSING_ICON_COLOR,
			'stroke-width': stroke,
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			style:
				`stroke: var(--maplibre2svg-missing-icon-color, ${MISSING_ICON_COLOR}); ` +
				'fill: var(--maplibre2svg-missing-icon-fill, none)'
		},
		[
			el(doc, 'rect', {
				x: inset,
				y: inset,
				width: Math.max(1, width - stroke),
				height: Math.max(1, height - stroke),
				rx: Math.min(2 * stroke, m / 4)
			}),
			el(doc, 'line', { x1: cx, x2: cx, y1: cy - 0.22 * m, y2: cy + 0.05 * m }),
			el(doc, 'line', { x1: cx, x2: cx + 0.01, y1: cy + 0.24 * m, y2: cy + 0.24 * m })
		]
	);
	const mask = doc.createElementNS(XHTML_NS, 'div');
	mask.setAttribute('xmlns', XHTML_NS);
	mask.setAttribute('style', CUSTOM_ICON_STYLE);
	// `display` as an attribute, not in `style`, so that a stylesheet can show it
	const custom = el(
		doc,
		'foreignObject',
		{ class: `${MISSING_ICON_CLASS}-custom`, x: 0, y: 0, width, height, display: 'none' },
		[mask]
	);
	const group = el(doc, 'g', { class: MISSING_ICON_CLASS }, [shape, custom]);
	return { nodes: [group], defs: [], width, height };
}
