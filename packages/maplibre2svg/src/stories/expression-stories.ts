import type { Meta, StoryObj } from '@storybook/html-vite';
import type { LayerSpecification } from 'maplibre-gl';
import { customLabelsMetadata } from './fixtures/expressions';
import { legendArgs, legendArgTypes, renderLegend, type LegendStoryArgs } from './render';

/** Args of the stories of a layer type */
export type TypeStoryArgs = LegendStoryArgs & { showDefault: boolean };
export type TypeStory = StoryObj<TypeStoryArgs>;

/** The paint and layout properties which one story sets */
export interface LayerParts {
	paint?: Record<string, unknown>;
	layout?: Record<string, unknown>;
}

/**
 * The expression stories which every vector layer type has, with the same names and order
 * so that the types can be compared. `LinearSize` is for the types with a size property.
 */
export interface ExpressionCases {
	Categorical: LayerParts;
	CategoricalCase: LayerParts;
	Graduated: LayerParts;
	Linear: LayerParts;
	LinearSize?: LayerParts;
	LinearExponential: LayerParts;
	ZoomAndData: LayerParts;
}

/**
 * The args of the stories of a layer type. The default export of a stories file must be an
 * object literal with a literal title, so each file writes its own and spreads this.
 */
export const typeMetaArgs = {
	args: { ...legendArgs, showDefault: true },
	argTypes: { ...legendArgTypes, showDefault: { control: 'boolean' } }
} satisfies Meta<TypeStoryArgs>;

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

/** A story of one layer of the type */
export function layerStory(type: string, name: string, parts: LayerParts): TypeStory {
	return { name, render: (args) => renderLegend(storyLayer(type, name, parts), args) };
}

/**
 * The expression stories of a layer type: the cases given, and `CustomLabels`, which is
 * `Categorical` with `metadata.legend`
 */
export function expressionStories(type: string, cases: ExpressionCases) {
	const story = (name: string, parts: LayerParts) => layerStory(type, name, parts);
	return {
		Categorical: story('Categorical', cases.Categorical),
		CategoricalCase: story('CategoricalCase', cases.CategoricalCase),
		Graduated: story('Graduated', cases.Graduated),
		Linear: story('Linear', cases.Linear),
		LinearSize: cases.LinearSize ? story('LinearSize', cases.LinearSize) : undefined,
		LinearExponential: story('LinearExponential', cases.LinearExponential),
		ZoomAndData: story('ZoomAndData', cases.ZoomAndData),
		CustomLabels: {
			name: 'CustomLabels',
			render: (args) =>
				renderLegend(
					storyLayer(
						type,
						'CustomLabels',
						cases.Categorical,
						customLabelsMetadata(args.showDefault)
					),
					args
				)
		} satisfies TypeStory
	};
}
