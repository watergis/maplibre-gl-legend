import type { Meta } from '@storybook/html-vite';
import type { TypeStory } from './expression-stories';
import {
	expressionStories,
	layerStory,
	storyLayer,
	typeMetaArgs,
	type TypeStoryArgs
} from './expression-stories';
import {
	categorical,
	categoricalCase,
	exponential,
	graduated,
	legacyStops,
	linear,
	PALETTE,
	zoomAndData
} from './fixtures/expressions';
import { renderLayers } from './render';
import { storyImages } from './sprite';

export default { title: 'Layers/symbol', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

const symbol = (
	name: string,
	layout: Record<string, unknown>,
	paint: Record<string, unknown> = {}
) => layerStory('symbol', name, { layout, paint }, storyImages);

/** an icon of the demo sprite at icon-size 1 */
export const IconOnly = symbol('IconOnly', { 'icon-image': 'meter_on' });

/** icon-size 0.5, 1 and 2 */
export const IconSizes: TypeStory = {
	render: (args) =>
		renderLayers(
			[0.5, 1, 2].map((size) =>
				storyLayer('symbol', `IconSize${String(size).replace('.', '_')}`, {
					layout: { 'icon-image': 'park_11', 'icon-size': size }
				})
			),
			args,
			storyImages()
		)
};

/** icon-rotate 45 */
export const Rotated = symbol('Rotated', { 'icon-image': 'airport_11', 'icon-rotate': 45 });

/**
 * an SDF icon tinted with icon-color, with a white halo. The demo sprite has no SDF image, so
 * `disc-sdf` is a disc made in code (fixtures/images.ts)
 */
export const SdfTinted = symbol(
	'SdfTinted',
	{ 'icon-image': 'disc-sdf' },
	{ 'icon-color': '#e41a1c', 'icon-halo-color': '#ffffff', 'icon-halo-width': 2 }
);

/** an image which the sprite does not have: the neutral placeholder */
export const MissingImage = symbol('MissingImage', { 'icon-image': 'no-such-image' });

/** `meter_{status}`: the legend has no feature, so the first matching image stands for it */
export const TokenIcon = symbol('TokenIcon', { 'icon-image': 'meter_{status}' });

/** an icon and a label: the label is a placeholder until the glyphs are drawn */
export const IconAndText = symbol('IconAndText', { 'icon-image': 'meter', 'text-field': '{name}' });

const disc = { 'icon-image': 'disc-sdf' };

const stories = expressionStories(
	'symbol',
	{
		// the image switches by category
		Categorical: {
			layout: { 'icon-image': categorical(['meter_on', 'meter_co', 'meter_avg'], 'meter') }
		},
		CategoricalCase: {
			layout: {
				'icon-image': categoricalCase(['meter_on', 'meter_co', 'meter_avg', 'meter'], 'circle_11')
			}
		},
		// color and size linked to the same field
		Graduated: {
			layout: { ...disc, 'icon-size': graduated([0.5, 0.7, 0.9, 1.1]) },
			paint: { 'icon-color': graduated(['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']) }
		},
		Linear: {
			layout: disc,
			paint: { 'icon-color': linear(['#ffffcc', '#41b6c4', '#253494']) }
		},
		LinearSize: {
			layout: { ...disc, 'icon-size': linear([0.4, 0.8, 1.4]) },
			paint: { 'icon-color': '#253494' }
		},
		LinearExponential: {
			layout: { ...disc, 'icon-size': exponential([0.4, 0.8, 1.4]) },
			paint: { 'icon-color': legacyStops(['#f7fcf5', '#74c476', '#00441b']) }
		},
		ZoomAndData: {
			layout: { ...disc, 'icon-size': zoomAndData([0.4, 0.4, 0.4], [0.8, 1, 1.2], [0.3, 0.6]) },
			paint: { 'icon-color': PALETTE[1] }
		}
	},
	storyImages
);

export const Categorical = stories.Categorical;
export const CategoricalCase = stories.CategoricalCase;
export const Graduated = stories.Graduated;
export const Linear = stories.Linear;
export const LinearSize = stories.LinearSize;
export const LinearExponential = stories.LinearExponential;
export const ZoomAndData = stories.ZoomAndData;
export const CustomLabels = stories.CustomLabels;
