import { uniqueId } from '../svg';

const REFERENCE = /url\(#([^)]+)\)/g;

/**
 * A deep copy of a symbol whose ids (`clipPath`, gradients, patterns) are new and unique on the
 * page, with the references to them (`url(#…)`, `href="#…"`) changed alike, so that the copy can
 * sit in one document with the original and with copies of other symbols
 */
export function cloneWithUniqueIds<T extends Element>(node: T): T {
	const copy = node.cloneNode(true) as T;
	const renamed = new Map<string, string>();
	for (const element of [copy, ...copy.querySelectorAll('[id]')]) {
		const id = element.getAttribute('id');
		if (!id) continue;
		const next = uniqueId('copy');
		renamed.set(id, next);
		element.setAttribute('id', next);
	}
	if (renamed.size === 0) return copy;
	for (const element of [copy, ...copy.querySelectorAll('*')]) {
		for (const attr of [...element.attributes]) {
			let value = attr.value.replace(REFERENCE, (match, id: string) =>
				renamed.has(id) ? `url(#${renamed.get(id)})` : match
			);
			if (attr.name === 'href' && value.startsWith('#') && renamed.has(value.slice(1))) {
				value = `#${renamed.get(value.slice(1))}`;
			}
			if (value !== attr.value) element.setAttribute(attr.name, value);
		}
	}
	return copy;
}
