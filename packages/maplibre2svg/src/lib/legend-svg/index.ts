import { createSvg, el, fmt } from '../svg';
import { canvasMeasurer, safeMeasurer, type TextMeasurer } from '../text-measure';
import type { LayerLegend } from '../types';
import { cloneWithUniqueIds } from './ids';
import { fitText, widthOf, type WidthOf } from './text';

/** How `legendToSvg` lays the legends out */
export interface LegendSvgOptions {
	/** width of the SVG; by default the content's, up to `maxWidth` */
	width?: number;
	/** the largest width when `width` is not given, 480 by default; longer labels get an ellipsis */
	maxWidth?: number;
	/** space around the content, 8 by default */
	padding?: number;
	/** space between rows, 4 by default */
	rowGap?: number;
	fontFamily?: string;
	/** 12 by default */
	fontSize?: number;
	/** color of the text, `#222222` by default */
	color?: string;
	/** fill of the background; none by default */
	background?: string;
	/** a line between layers */
	separator?: boolean;
	/** the layers from the last to the first, as the control's `reverseOrder` */
	reverse?: boolean;
	/** a title row per layer: always, only for layers of several entries (default), or never */
	titles?: 'always' | 'multi' | 'never';
	document?: Document;
	/** measures text; a canvas by default, else (or when it fails) widths are estimated */
	measureText?: TextMeasurer;
	/**
	 * Write `xlink:href` beside every `href`, with `xmlns:xlink`, for SVG consumers other than
	 * browsers. True by default
	 */
	xlink?: boolean;
}

/** Indent of the entries under a title */
const INDENT = 12;
/** Space between a symbol and its label */
const GAP = 6;

type Row =
	| { kind: 'title'; text: string; height: number }
	| {
			kind: 'entry';
			svg: SVGSVGElement;
			width: number;
			height: number;
			text: string;
			indent: number;
			/** the widest symbol of the layer, which its labels align after */
			column: number;
	  }
	| { kind: 'separator'; height: number };

function rowsOf(
	legends: LayerLegend[],
	options: Required<Pick<LegendSvgOptions, 'titles' | 'separator'>>,
	lineHeight: number
) {
	const rows: Row[] = [];
	legends.forEach((legend, i) => {
		if (i > 0 && options.separator) rows.push({ kind: 'separator', height: 1 });
		const titled =
			options.titles === 'always' || (options.titles === 'multi' && legend.entries.length > 1);
		if (titled) rows.push({ kind: 'title', text: legend.label, height: lineHeight });
		const column = Math.max(0, ...legend.entries.map((entry) => entry.width));
		for (const entry of legend.entries) {
			rows.push({
				kind: 'entry',
				svg: entry.svg,
				width: entry.width,
				height: Math.max(entry.height, lineHeight),
				text: entry.label,
				indent: titled ? INDENT : 0,
				column
			});
		}
	});
	return rows;
}

/** The largest width of the SVG */
const MAX_WIDTH = 10000;

/** A finite, non-negative number up to `max`, else the default */
function sane(value: number | undefined, fallback: number, max: number): number {
	return value !== undefined && Number.isFinite(value) && value >= 0
		? Math.min(value, max)
		: fallback;
}

const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * Give every `href` an `xlink:href` too, with the namespace declared, for the SVG consumers
 * which only read that (older Inkscape and Illustrator, rsvg)
 */
function addXlink(svg: SVGSVGElement) {
	svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', XLINK_NS);
	for (const node of svg.querySelectorAll('[href]')) {
		node.setAttributeNS(XLINK_NS, 'xlink:href', node.getAttribute('href') ?? '');
	}
}

function textNode(doc: Document, text: string, x: number, y: number, bold = false) {
	const node = el(doc, 'text', {
		x,
		y,
		'dominant-baseline': 'central',
		'font-weight': bold ? 'bold' : undefined
	});
	node.textContent = text;
	return node;
}

/**
 * One standalone SVG of the legends of several layers, stacked, like `render_all` of the Rust
 * maplibre-legend: per layer an optional title row, then the rows of symbol and label. The
 * symbols are copied (the entries are not changed), with ids made unique, into nested `<svg>`s.
 */
export function legendToSvg(legends: LayerLegend[], options: LegendSvgOptions = {}): SVGSVGElement {
	const doc = options.document ?? legends[0]?.entries[0]?.svg.ownerDocument ?? globalThis.document;
	const padding = sane(options.padding, 8, 200);
	const rowGap = sane(options.rowGap, 4, 200);
	const fontSize = sane(options.fontSize, 12, 200) || 12;
	const fontFamily = options.fontFamily ?? 'sans-serif';
	const lineHeight = fontSize * 1.4;
	const ordered = options.reverse ? [...legends].reverse() : legends;
	const rows = rowsOf(
		ordered,
		{ titles: options.titles ?? 'multi', separator: options.separator ?? false },
		lineHeight
	);
	const measurer = safeMeasurer(options.measureText ?? canvasMeasurer(doc));
	const measure = widthOf(measurer, `${fontSize}px ${fontFamily}`, fontSize);
	const bold = widthOf(measurer, `bold ${fontSize}px ${fontFamily}`, fontSize);
	const labelX = (row: Row) =>
		row.kind === 'entry' ? padding + row.indent + row.column + GAP : padding;
	const widthFor = (row: Row): WidthOf => (row.kind === 'title' ? bold : measure);

	const natural = Math.max(
		2 * padding,
		...rows.map((row) =>
			row.kind === 'separator' ? 0 : labelX(row) + widthFor(row)(row.text) + padding
		)
	);
	const maxWidth = sane(options.maxWidth, 480, MAX_WIDTH);
	const width =
		options.width !== undefined && Number.isFinite(options.width) && options.width > 0
			? Math.min(options.width, MAX_WIDTH)
			: Math.min(natural, maxWidth || 480);

	const symbols: Element[] = [];
	const texts: Element[] = [];
	const lines: Element[] = [];
	let y = padding;
	for (const row of rows) {
		if (row.kind === 'separator') {
			lines.push(
				el(doc, 'line', {
					x1: padding,
					x2: width - padding,
					y1: y + 0.5,
					y2: y + 0.5,
					stroke: 'rgba(128,128,128,0.5)',
					'stroke-width': 1
				})
			);
		} else {
			const text = fitText(row.text, Math.max(0, width - padding - labelX(row)), widthFor(row));
			if (row.kind === 'entry') {
				const symbol = cloneWithUniqueIds(row.svg);
				symbol.setAttribute('x', fmt(padding + row.indent));
				symbol.setAttribute(
					'y',
					fmt(y + (row.height - Number(symbol.getAttribute('height') ?? 0)) / 2)
				);
				symbols.push(symbol);
			}
			texts.push(textNode(doc, text, labelX(row), y + row.height / 2, row.kind === 'title'));
		}
		y += row.height + rowGap;
	}
	const height = Math.max(2 * padding, y - rowGap + padding);
	const svg = createSvg(doc, width, height);
	if (options.background) svg.append(el(doc, 'rect', { width, height, fill: options.background }));
	// the font and color on the text only, so that the symbols do not inherit them
	const labels = el(
		doc,
		'g',
		{ 'font-family': fontFamily, 'font-size': fontSize, fill: options.color ?? '#222222' },
		texts
	);
	svg.append(...lines, ...symbols, labels);
	if (options.xlink ?? true) addXlink(svg);
	return svg;
}
