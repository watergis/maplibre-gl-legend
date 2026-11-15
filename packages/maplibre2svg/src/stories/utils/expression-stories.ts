import type { ArgTypes, Meta, StoryObj } from '@storybook/html-vite';
import type { LayerSpecification } from 'maplibre-gl';
import { customLabelsMetadata } from './fixtures/expressions';
import {
	legendArgs,
	legendArgTypes,
	renderLegend,
	type LegendStoryArgs,
	type StorySetup
} from './render';
import {
	argsToParts,
	partsToArgs,
	specArgTypes,
	storyArgTypes,
	type LayerParts
} from './render/spec-args';

export type { LayerParts } from './render/spec-args';

/** Args of the stories of a layer type: the legend options and the layer properties */
export type TypeStoryArgs = LegendStoryArgs & { showDefault: boolean } & Record<string, unknown>;
export type TypeStory = StoryObj<TypeStoryArgs>;

/** What a story renders with besides the layer, made for each render (such as sprite images) */
export type SetupLoader = (args: TypeStoryArgs) => StorySetup;

/**
 * The expression stories which every vector layer type has, with the same names and order
 * so that the types can be compared. `LinearInterpolateSize` is for the types with a size
 * property.
 */
export interface ExpressionCases {
	CategoricalMatch: LayerParts;
	CategoricalCase: LayerParts;
	GraduatedStep: LayerParts;
	LinearInterpolate: LayerParts;
	LinearInterpolateSize?: LayerParts;
	ExponentialInterpolate: LayerParts;
	ZoomAndDataInterpolate: LayerParts;
}

/**
 * The args and controls of the stories of a layer type: the legend options, and one control per
 * paint and layout property of the MapLibre style specification. The default export of a stories
 * file must be an object literal with a literal title, so each file writes its own and spreads
 * this.
 */
export function typeMeta(type: string) {
	return {
		args: { ...legendArgs, showDefault: true },
		argTypes: {
			...legendArgTypes,
			showDefault: {
				control: 'boolean',
				description: '`CustomLabels`: show the fallback class',
				table: { category: 'legend' }
			},
			...specArgTypes(type)
		}
	} satisfies Meta<TypeStoryArgs>;
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase());

/** A layer of the type, built from the parts of a story */
export function storyLayer(type: string, name: string, parts: LayerParts, metadata?: unknown) {
	return {
		id: `${type}-${kebab(name)}`,
		type,
		source: 'data',
		...(type === 'background' ? { source: undefined } : {}),
		...parts,
		...(metadata ? { metadata } : {})
	} as unknown as LayerSpecification;
}

/** What a story adds to the layer and the args of its type */
export interface StoryExtras {
	/** what the story renders with besides the layer */
	setup?: SetupLoader;
	/** args of the story besides the layer properties */
	args?: Record<string, unknown>;
	argTypes?: Partial<ArgTypes<TypeStoryArgs>>;
	/** the layer drawn, from the one of the args: such as its source */
	layer?: (layer: LayerSpecification, args: TypeStoryArgs) => LayerSpecification;
	/** the `metadata` of the layer */
	metadata?: (args: TypeStoryArgs) => unknown;
}

/**
 * A story of one layer of the type. Its paint and layout properties are args, so that every
 * property can be changed in the controls; `name` is the export name of the story, which the
 * layer id is made of.
 */
export function layerStory(
	type: string,
	name: string,
	parts: LayerParts,
	extras: StoryExtras = {}
): TypeStory {
	return {
		args: { ...partsToArgs(parts), ...extras.args },
		argTypes: { ...storyArgTypes(parts), ...extras.argTypes },
		render: (args) => {
			const layer = storyLayer(type, name, argsToParts(type, args), extras.metadata?.(args));
			return renderLegend(
				extras.layer ? extras.layer(layer, args) : layer,
				args,
				extras.setup?.(args) ?? {}
			);
		}
	};
}

/**
 * The expression stories of a layer type: the cases given, and `CustomLabels`, which is
 * `CategoricalMatch` with `metadata.legend`
 */
export function expressionStories(type: string, cases: ExpressionCases, setup?: SetupLoader) {
	const story = (name: string, parts: LayerParts) => layerStory(type, name, parts, { setup });
	return {
		CategoricalMatch: story('CategoricalMatch', cases.CategoricalMatch),
		CategoricalCase: story('CategoricalCase', cases.CategoricalCase),
		GraduatedStep: story('GraduatedStep', cases.GraduatedStep),
		LinearInterpolate: story('LinearInterpolate', cases.LinearInterpolate),
		LinearInterpolateSize: cases.LinearInterpolateSize
			? story('LinearInterpolateSize', cases.LinearInterpolateSize)
			: undefined,
		ExponentialInterpolate: story('ExponentialInterpolate', cases.ExponentialInterpolate),
		ZoomAndDataInterpolate: story('ZoomAndDataInterpolate', cases.ZoomAndDataInterpolate),
		CustomLabels: layerStory(type, 'CustomLabels', cases.CategoricalMatch, {
			setup,
			metadata: (args) => customLabelsMetadata(args.showDefault)
		})
	};
}
