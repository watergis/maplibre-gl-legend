import type { LayerSpecification } from 'maplibre-gl';
import {
	isValidValue,
	propertySpec,
	toExpression,
	type GeometryType,
	type LayerEvaluator,
	type PropertyGroup
} from '../style';
import { fieldsRead } from './accessor';
import { seedFromFilter, type FilterSeed } from './filter-seed';
import { findClassifierNodes, inputIndex, type ClassifierNode } from './find-node';
import { defaultNodeClassifiers, type NodeClassifiers } from './node-classifiers';
import { substitutionOverrides, type ClassificationAxis } from './substitute';
import type { LegendClass } from './types';
import { cleanProperties, type ClassifyContext } from './verify';
import { candidatesOfNodes } from './zoom-merge';

/** What the classifier needs to know about a layer type; a `LayerAdapter` has it */
export interface LayerTypeRules {
	readonly geometryType: GeometryType;
	readonly classificationAxes: readonly (readonly [PropertyGroup, string])[];
	readonly classifyingInputs?: ReadonlySet<string>;
}

/** The rules of each layer type; an `AdapterRegistry` is one */
export interface LayerTypeRulebook {
	get(type: string): LayerTypeRules;
}

export interface ClassifyOptions {
	zoom: number;
}

/** The axis of a layer which classifies it, and its classifying nodes */
interface FoundAxis {
	axis: ClassificationAxis;
	nodes: ClassifierNode[];
}

function readProperty(layer: LayerSpecification, group: PropertyGroup, name: string) {
	return (layer as { [key in PropertyGroup]?: Record<string, unknown> })[group]?.[name];
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

/**
 * Splits a layer into the classes of its legend.
 *
 * 1. The filter of the layer gives the properties every feature has (the seed).
 * 2. The first classification axis of the layer type whose value depends on the feature
 *    (a `match`, `case`, `step` or `interpolate`, possibly inside a zoom `interpolate`) is
 *    the axis; the node classifier of its kind makes the classes.
 * 3. Each class gets the layer evaluated for its representative feature; a class without one
 *    gets the output of its branch substituted for the node.
 *
 * A layer without a feature-dependent axis gives one `single` class.
 */
export class LayerClassifier {
	readonly #rules: LayerTypeRulebook;
	readonly #evaluator: LayerEvaluator;
	readonly #classifiers: NodeClassifiers;

	constructor(
		rules: LayerTypeRulebook,
		evaluator: LayerEvaluator,
		classifiers: NodeClassifiers = defaultNodeClassifiers()
	) {
		this.#rules = rules;
		this.#evaluator = evaluator;
		this.#classifiers = classifiers;
	}

	/**
	 * The classes of a layer, each with the layer evaluated for a representative feature at
	 * the zoom
	 */
	classify(layer: LayerSpecification, options: ClassifyOptions): LegendClass[] {
		const { zoom } = options;
		const filterSeed = seedFromFilter((layer as { filter?: unknown }).filter);
		const { geometryType } = filterSeed;
		const found = this.#findAxis(layer, zoom);
		const seed = found ? seedWithout(filterSeed, found.nodes) : filterSeed;
		const target = found ? this.#candidates(layer, zoom, found, seed) : undefined;
		if (!target) {
			const properties = { ...seed.properties };
			const evaluated = this.#evaluator.evaluate(layer, { zoom, properties, geometryType });
			return [{ kind: 'single', properties, label: { kind: 'single' }, layer: evaluated }];
		}
		return target.candidates.map((candidate) => {
			const properties = cleanProperties({ ...seed.properties, ...candidate.properties });
			return {
				kind: candidate.kind,
				properties,
				label: candidate.label,
				layer: this.#evaluator.evaluate(layer, {
					zoom,
					properties,
					geometryType,
					overrides: substitutionOverrides(target.axis, candidate.found, candidate)
				})
			};
		});
	}

	/** The first axis of the layer whose value has a feature-dependent branch, and its nodes */
	#findAxis(layer: LayerSpecification, zoom: number): FoundAxis | undefined {
		const rules = this.#rules.get(layer.type);
		for (const [group, name] of rules.classificationAxes) {
			const value = readProperty(layer, group, name);
			const spec = propertySpec(layer.type, group, name);
			if (value === undefined || !spec || !isValidValue(value, spec)) continue;
			try {
				const expression = toExpression(value, spec);
				const nodes = findClassifierNodes(expression, zoom, rules.classifyingInputs);
				if (nodes.length > 0) return { axis: { group, name, expression }, nodes };
			} catch {
				// a legacy function which cannot be converted: not an axis
			}
		}
		return undefined;
	}

	#candidates(layer: LayerSpecification, zoom: number, target: FoundAxis, seed: FilterSeed) {
		const ctx: ClassifyContext = {
			zoom,
			geometryType: seed.geometryType ?? this.#rules.get(layer.type).geometryType,
			base: seed.properties
		};
		try {
			const candidates = candidatesOfNodes(target.nodes, ctx, this.#classifiers);
			return candidates.length > 0 ? { axis: target.axis, candidates } : undefined;
		} catch {
			return undefined;
		}
	}
}
