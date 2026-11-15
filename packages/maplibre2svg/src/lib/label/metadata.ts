import type { LayerSpecification } from 'maplibre-gl';

/**
 * Overrides of the legend in `layer.metadata.legend`, compatible with the Rust
 * maplibre-legend:
 *
 * ```json
 * "metadata": {
 *   "legend": {
 *     "label": "Land use",
 *     "default": "Everything else",
 *     "custom-labels": ["Homes", "Shops"],
 *     "show-default": false
 *   }
 * }
 * ```
 *
 * `custom-labels` replaces the labels of the classes other than the default, by position.
 * It can also be an object which maps a generated label to its replacement.
 */
export interface LegendMetadata {
	label?: string;
	default?: string;
	customLabels?: string[] | Record<string, string>;
	showDefault?: boolean;
}

const asString = (value: unknown) =>
	typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;

function asCustomLabels(value: unknown): LegendMetadata['customLabels'] {
	if (Array.isArray(value)) return value.map((item) => asString(item) ?? '');
	if (value && typeof value === 'object') {
		const entries = Object.entries(value).map(([key, item]) => [key, asString(item)] as const);
		return Object.fromEntries(entries.filter(([, item]) => item !== undefined)) as Record<
			string,
			string
		>;
	}
	return undefined;
}

/** Read `metadata.legend` of a layer, ignoring the values of a wrong type */
export function readLegendMetadata(layer: LayerSpecification): LegendMetadata {
	const metadata = (layer as { metadata?: unknown }).metadata;
	const legend =
		metadata && typeof metadata === 'object'
			? (metadata as Record<string, unknown>).legend
			: undefined;
	if (!legend || typeof legend !== 'object') return {};
	const raw = legend as Record<string, unknown>;
	const showDefault = raw['show-default'];
	return {
		label: asString(raw.label),
		default: asString(raw.default),
		customLabels: asCustomLabels(raw['custom-labels']),
		showDefault: typeof showDefault === 'boolean' ? showDefault : undefined
	};
}
