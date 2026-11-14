export const SVG_NS = 'http://www.w3.org/2000/svg';

export type Attrs = Record<string, string | number | undefined>;

/** Format a number for an SVG attribute, rounded to 2 decimals */
export function fmt(value: number) {
	const rounded = Math.round(value * 100) / 100;
	return Object.is(rounded, -0) ? '0' : String(rounded);
}

export function setAttrs(node: Element, attrs: Attrs) {
	for (const [name, value] of Object.entries(attrs)) {
		if (value === undefined) continue;
		const text = typeof value === 'number' ? fmt(value) : value;
		node.setAttribute(name, text);
	}
}

/** Create an SVG element */
export function el(doc: Document, name: string, attrs: Attrs = {}, children: Node[] = []) {
	const node = doc.createElementNS(SVG_NS, name) as SVGElement;
	setAttrs(node, attrs);
	for (const child of children) node.appendChild(child);
	return node;
}

/** Create the root `<svg>` of a symbol, with its size as `width`, `height` and `viewBox` */
export function createSvg(doc: Document, width: number, height: number, children: Node[] = []) {
	return el(
		doc,
		'svg',
		{
			xmlns: SVG_NS,
			width,
			height,
			viewBox: `0 0 ${fmt(width)} ${fmt(height)}`
		},
		children
	) as SVGSVGElement;
}

let counter = 0;
/**
 * A token of this copy of the module, so that ids stay unique when SVGs made by different pages
 * or copies of the library end up in one document
 */
const SESSION = Math.random().toString(36).slice(2, 7);

/**
 * An id which is unique on the page, for `<linearGradient>`, `<pattern>` and the like: many
 * legends, each with its own SVG, can share one page
 */
export function uniqueId(prefix: string) {
	counter += 1;
	return `m2s-${SESSION}-${prefix}-${counter}`;
}
