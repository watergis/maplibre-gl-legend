import { el, uniqueId } from '../svg';

/**
 * A `<pattern>` which tiles an image of `width × height` CSS pixels from `(x, y)`, with an id
 * unique on the page. Gives the element for `<defs>` and the paint which refers to it.
 */
export function patternOf(
	doc: Document,
	href: string,
	width: number,
	height: number,
	x = 0,
	y = 0
): { paint: string; element: Element } {
	const id = uniqueId('pattern');
	const image = el(doc, 'image', { href, width, height, preserveAspectRatio: 'none' });
	const element = el(doc, 'pattern', { id, patternUnits: 'userSpaceOnUse', x, y, width, height }, [
		image
	]);
	return { paint: `url(#${id})`, element };
}
