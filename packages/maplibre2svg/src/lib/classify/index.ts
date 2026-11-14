import type { LayerSpecification } from 'maplibre-gl';
import {
	evaluateLayer,
	geometryTypeOf,
	isValidValue,
	propertySpec,
	toExpression,
	type PropertyGroup
} from '../expression';
import { caseClasses } from './case';
import { fieldsRead } from './accessor';
import {
	findClassifierNodes,
	inputIndex,
	type ClassifierKind,
	type ClassifierNode
} from './find-node';
import { interpolateClasses } from './interpolate';
import { matchClasses } from './match';
import { stepClasses } from './step';
import { candidatesOfNodes } from './zoom-merge';
import { seedFromFilter, type FilterSeed } from './filter-seed';
import { substitutionOverrides, type ClassificationAxis } from './substitute';
import type { ClassCandidate, LegendClass } from './types';
import { cleanProperties, type ClassifyContext } from './verify';

export type { FeatureProperties, LabelInfo, LegendClass } from './types';

/** The properties which a layer type can be classified by, in order of priority */
export const CLASSIFICATION_AXES: Record<string, [PropertyGroup, string][]> = {
	fill: [
		['paint', 'fill-color'],
		['paint', 'fill-pattern'],
		['paint', 'fill-outline-color'],
		['paint', 'fill-opacity']
	],
	line: [
		['paint', 'line-color'],
		['paint', 'line-pattern'],
		['paint', 'line-width'],
		['paint', 'line-dasharray']
	],
	circle: [
		['paint', 'circle-color'],
		['paint', 'circle-radius'],
		['paint', 'circle-stroke-color']
	],
	symbol: [
		['layout', 'icon-image'],
		['paint', 'icon-color'],
		['paint', 'text-color'],
		['layout', 'icon-size'],
		['layout', 'text-size']
	],
	'fill-extrusion': [['paint', 'fill-extrusion-color']],
	'color-relief': [['paint', 'color-relief-color']]
};

/**
 * Inputs which classify a layer type besides the feature: `color-relief` is classified by
 * `elevation`. Such classes have no representative feature: the output of each branch stands
 * in for the node (branch substitution).
 */
const CLASSIFYING_INPUTS: Record<string, ReadonlySet<string>> = {
	'color-relief': new Set(['elevation'])
};

const CLASSIFIERS: Record<
	ClassifierKind,
	(found: ClassifierNode, ctx: ClassifyContext) => ClassCandidate[]
> = {
	match: matchClasses,
	case: caseClasses,
	step: stepClasses,
	interpolate: interpolateClasses
};

export interface ClassifyOptions {
	zoom: number;
}

function readProperty(layer: LayerSpecification, group: PropertyGroup, name: string) {
	return (layer as { [key in PropertyGroup]?: Record<string, unknown> })[group]?.[name];
}

/** The first axis of the layer whose value has a feature-dependent branch, and its nodes */
function findAxis(layer: LayerSpecification, zoom: number) {
	for (const [group, name] of CLASSIFICATION_AXES[layer.type] ?? []) {
		const value = readProperty(layer, group, name);
		const spec = propertySpec(layer.type, group, name);
		if (value === undefined || !spec || !isValidValue(value, spec)) continue;
		try {
			const expression = toExpression(value, spec);
			const nodes = findClassifierNodes(expression, zoom, CLASSIFYING_INPUTS[layer.type]);
			if (nodes.length > 0)
				return { axis: { group, name, expression } as ClassificationAxis, nodes };
		} catch {
			// a legacy function which cannot be converted: not an axis
		}
	}
	return undefined;
}

/**
 * The seed without the fields which the classifying nodes read: each class decides those, and
 * the default class must not inherit the value of another class from the filter
 */
function seedWithout(seed: FilterSeed, nodes: ClassifierNode[]): FilterSeed {
	const read = new Set<string>();
	for (const node of nodes) {
		const index = inputIndex(node.resolved[0] as string);
		const inputs =
			index === undefined
				? node.resolved.slice(1, -1).filter((_, i) => i % 2 === 0)
				: [node.resolved[index]];
		for (const input of inputs) fieldsRead(input, read);
	}
	const properties = Object.fromEntries(
		Object.entries(seed.properties).filter(([field]) => !read.has(field))
	);
	return { ...seed, properties };
}

function candidatesOf(
	layer: LayerSpecification,
	zoom: number,
	target: NonNullable<ReturnType<typeof findAxis>>,
	seed: FilterSeed
) {
	const ctx: ClassifyContext = {
		zoom,
		geometryType: seed.geometryType ?? geometryTypeOf(layer.type),
		base: seed.properties
	};
	try {
		const candidates = candidatesOfNodes(target.nodes, ctx, CLASSIFIERS);
		return candidates.length > 0 ? { axis: target.axis, candidates } : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Split a layer into the classes of its legend, each with the layer evaluated for a
 * representative feature at the zoom. A layer without a feature-dependent classification
 * gives one `single` class, evaluated for a feature without properties.
 */
export function classifyLayer(layer: LayerSpecification, options: ClassifyOptions): LegendClass[] {
	const { zoom } = options;
	const filterSeed = seedFromFilter((layer as { filter?: unknown }).filter);
	const { geometryType } = filterSeed;
	const axis = findAxis(layer, zoom);
	const seed = axis ? seedWithout(filterSeed, axis.nodes) : filterSeed;
	const target = axis ? candidatesOf(layer, zoom, axis, seed) : undefined;
	if (!target) {
		const properties = { ...seed.properties };
		const evaluated = evaluateLayer(layer, { zoom, properties, geometryType });
		return [{ kind: 'single', properties, label: { kind: 'single' }, layer: evaluated }];
	}
	return target.candidates.map((candidate) => {
		const properties = cleanProperties({ ...seed.properties, ...candidate.properties });
		return {
			kind: candidate.kind,
			properties,
			label: candidate.label,
			layer: evaluateLayer(layer, {
				zoom,
				properties,
				geometryType,
				overrides: substitutionOverrides(target.axis, candidate.found, candidate)
			})
		};
	});
}
