import type { Meta, StoryObj } from '@storybook/html-vite';
import type { FillLayerSpecification } from 'maplibre-gl';
import {
	categorical,
	categoricalCase,
	customLabelsMetadata,
	exponential,
	FALLBACK_COLOR,
	graduated,
	legacyStops,
	linear,
	PALETTE,
	zoomAndData
} from './fixtures/expressions';
import { legendArgs, legendArgTypes, renderLegend, type LegendStoryArgs } from './render';

type Args = LegendStoryArgs & { showDefault: boolean };

const OUTLINES = ['#7f0000', '#0b3c6b', '#1b5e20', '#4a148c'];

const fill = (
	id: string,
	paint: FillLayerSpecification['paint'],
	metadata?: unknown
): FillLayerSpecification => ({ id, type: 'fill', source: 'data', paint, metadata });

const meta: Meta<Args> = {
	title: 'Layers/fill',
	args: { ...legendArgs, showDefault: true },
	argTypes: { ...legendArgTypes, showDefault: { control: 'boolean' } }
};
export default meta;

type Story = StoryObj<Args>;

/** `match` on a category, with a branch of several values and the fallback */
export const Categorical: Story = {
	render: (args) =>
		renderLegend(
			fill('fill-categorical', {
				'fill-color': categorical([...PALETTE], FALLBACK_COLOR),
				'fill-outline-color': categorical(OUTLINES, '#555555')
			}),
			args
		)
};

/** `case` with `==`, `in`, `has` and a condition that cannot be synthesized (`Class 4`) */
export const CategoricalCase: Story = {
	render: (args) =>
		renderLegend(
			fill('fill-categorical-case', {
				'fill-color': categoricalCase([...PALETTE], FALLBACK_COLOR)
			}),
			args
		)
};

/** `step` on a number */
export const Graduated: Story = {
	render: (args) =>
		renderLegend(
			fill('fill-graduated', {
				'fill-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d'])
			}),
			args
		)
};

/** linear `interpolate` on a number, for the color and the opacity */
export const Linear: Story = {
	render: (args) =>
		renderLegend(
			fill('fill-linear', {
				'fill-color': linear(['#ffffcc', '#41b6c4', '#253494']),
				'fill-opacity': linear([0.3, 0.6, 1])
			}),
			args
		)
};

/** exponential `interpolate` for the color and a legacy `stops` function for the opacity */
export const LinearExponential: Story = {
	render: (args) =>
		renderLegend(
			fill('fill-exponential', {
				'fill-color': exponential(['#f7fcf5', '#74c476', '#00441b']),
				'fill-opacity': legacyStops([0.3, 0.6, 1])
			}),
			args
		)
};

/** `match` inside a zoom `interpolate`: the colors change with the zoom control */
export const ZoomAndData: Story = {
	render: (args) =>
		renderLegend(
			fill('fill-zoom-and-data', {
				'fill-color': zoomAndData(
					['#fdd0a2', '#c6dbef', '#c7e9c0'],
					[...PALETTE],
					['#eeeeee', FALLBACK_COLOR]
				)
			}),
			args
		)
};

/** labels from `metadata.legend`: `label`, `custom-labels`, `default`, `show-default` */
export const CustomLabels: Story = {
	render: (args) =>
		renderLegend(
			fill(
				'fill-custom-labels',
				{ 'fill-color': categorical([...PALETTE], FALLBACK_COLOR) },
				customLabelsMetadata(args.showDefault)
			),
			args
		)
};
