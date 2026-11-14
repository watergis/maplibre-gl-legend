export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';

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
		if (name === 'href') {
			// `xlink:href` is still what most editors and converters read
			node.setAttributeNS(XLINK_NS, 'xlink:href', text);
		}
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
