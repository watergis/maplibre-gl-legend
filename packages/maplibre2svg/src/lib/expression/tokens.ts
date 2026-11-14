import type { StylePropertySpecification } from 'maplibre-gl';

/** A `{token}` template whose fields the representative feature does not have */
export interface UnresolvedTokens {
	/**
	 * the value with the tokens the feature could fill filled, and the others kept, e.g.
	 * `us-interstate_{ref_length}` for `{network}_{ref_length}` and a feature with `network`
	 */
	template: string;
	/** the fields which were filled with an empty string, e.g. `['kind']` */
	fields: string[];
}

const TOKEN = /{([^{}]+)}/g;

/**
 * Whether the value is a legacy `{token}` string of a property which takes tokens
 * (`text-field`, `icon-image`). Expressions and functions are not.
 */
export function isTokenString(value: unknown, spec: StylePropertySpecification): value is string {
	return (
		(spec as { tokens?: boolean }).tokens === true &&
		typeof value === 'string' &&
		new RegExp(TOKEN.source).test(value)
	);
}

/**
 * Fill the tokens of a template with the properties of the feature. As MapLibre does, a field
 * which the feature does not have gives an empty string.
 */
export function resolveTokens(template: string, properties: Record<string, unknown>) {
	const missing: string[] = [];
	const has = (key: string) => Object.prototype.hasOwnProperty.call(properties, key);
	const text = template.replace(TOKEN, (_match, key: string) => {
		if (has(key)) return String(properties[key]);
		if (!missing.includes(key)) missing.push(key);
		return '';
	});
	const partial = template.replace(TOKEN, (match, key: string) =>
		has(key) ? String(properties[key]) : match
	);
	return { text, missing, partial };
}
