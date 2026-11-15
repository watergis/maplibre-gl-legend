import type { LayerSpecification } from 'maplibre-gl';
import type { LabelInfo } from '../classify';
import { describeCondition } from './condition';
import { formatValue, formatValues } from './format';
import { readLegendMetadata, type LegendMetadata } from './metadata';

export { describeCondition } from './condition';
export { formatValue, formatValues } from './format';
export { readLegendMetadata, type LegendMetadata } from './metadata';

export interface LabelOptions {
	/** label of the fallback class, `Other` by default */
	defaultLabel?: string;
}

/** A class with its label */
export type Labelled<T> = T & { text: string };

/** The label of a class, before `metadata.legend` overrides it */
export function generateLabel(info: LabelInfo, layerLabel: string, defaultLabel: string): string {
	switch (info.kind) {
		case 'single':
			return layerLabel;
		case 'default':
			return defaultLabel;
		case 'category':
			return formatValues(info.values);
		case 'stop':
			if (info.bound === 'lower') return `≤ ${formatValue(info.value)}`;
			if (info.bound === 'upper') return `≥ ${formatValue(info.value)}`;
			return formatValue(info.value);
		case 'range':
			if (info.min === undefined) return `< ${formatValue(info.max)}`;
			if (info.max === undefined) return `≥ ${formatValue(info.min)}`;
			return `${formatValue(info.min)} – ${formatValue(info.max)}`;
		case 'condition':
			return describeCondition(info.condition) ?? `Class ${info.index + 1}`;
	}
}

function customLabel(meta: LegendMetadata, position: number, generated: string) {
	const custom = meta.customLabels;
	if (Array.isArray(custom)) return custom[position] || generated;
	return custom?.[generated] ?? generated;
}

/** The label of a layer: `metadata.legend.label`, or the id of the layer */
export function layerLabelOf(layer: LayerSpecification): string {
	return readLegendMetadata(layer).label ?? layer.id;
}

/**
 * Label the classes of a layer and apply `metadata.legend`: `custom-labels` replaces the
 * labels of the classes other than the default, `default` the label of the default class,
 * and `"show-default": false` leaves the default class out.
 */
export function labelClasses<T extends { label: LabelInfo }>(
	layer: LayerSpecification,
	classes: T[],
	options: LabelOptions = {}
): Labelled<T>[] {
	const meta = readLegendMetadata(layer);
	const layerLabel = meta.label ?? layer.id;
	const defaultLabel = meta.default ?? options.defaultLabel ?? 'Other';
	const labelled: Labelled<T>[] = [];
	let position = 0;
	for (const cls of classes) {
		const generated = generateLabel(cls.label, layerLabel, defaultLabel);
		if (cls.label.kind === 'default') {
			if (meta.showDefault === false) continue;
			labelled.push({ ...cls, text: generated });
		} else if (cls.label.kind === 'single') {
			labelled.push({ ...cls, text: generated });
		} else {
			labelled.push({ ...cls, text: customLabel(meta, position++, generated) });
		}
	}
	return labelled;
}

/**
 * Labels the classes of a layer: generates a label from what each class stands for (the
 * values of a `match` branch, the interval of a `step`, a stop, a `case` condition) and applies
 * the overrides of `metadata.legend`
 */
export class LabelGenerator {
	readonly #options: LabelOptions;

	constructor(options: LabelOptions = {}) {
		this.#options = options;
	}

	/** The label of a layer: `metadata.legend.label`, or the id of the layer */
	layerLabel(layer: LayerSpecification): string {
		return layerLabelOf(layer);
	}

	/** The classes with their labels; the default class is left out with `show-default: false` */
	label<T extends { label: LabelInfo }>(layer: LayerSpecification, classes: T[]): Labelled<T>[] {
		return labelClasses(layer, classes, this.#options);
	}
}
