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
	CATEGORY_FIELD,
	exponential,
	graduated,
	legacyStops,
	linear,
	NUMBER_FIELD,
	PALETTE,
	zoomAndData
} from './fixtures/expressions';
import { NOTO_REGULAR, UNVT_GLYPHS } from './fixtures/fonts';
import { renderLayers } from './render';
import { storyImages, withImages } from './sprite';

export default { title: 'Layers/symbol', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

/** images of the sprites, and the glyphs of the unvt style for labels */
const withLabels = () => ({ options: storyImages(), style: { glyphs: UNVT_GLYPHS } });

const symbol = (
	name: string,
	layout: Record<string, unknown>,
	paint: Record<string, unknown> = {}
) => layerStory('symbol', name, { layout, paint }, withLabels);

/** an icon of the unvt sprite (not SDF) at icon-size 1 */
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
			withImages()
		)
};

/** icon-rotate 45 */
export const Rotated = symbol('Rotated', { 'icon-image': 'airport_11', 'icon-rotate': 45 });

/** an SDF icon of the UNDP sprite tinted with icon-color, with a white halo */
export const SdfTinted = symbol(
	'SdfTinted',
	{ 'icon-image': 'marker', 'icon-size': 1.5 },
	{ 'icon-color': '#e41a1c', 'icon-halo-color': '#ffffff', 'icon-halo-width': 2 }
);

/** the same with a dark halo, which shows on a light background */
export const SdfTintedDarkHalo = symbol(
	'SdfTintedDarkHalo',
	{ 'icon-image': 'marker', 'icon-size': 1.5 },
	{
		'icon-color': '#fdd835',
		'icon-halo-color': '#222222',
		'icon-halo-width': 1.5,
		'icon-halo-blur': 0.5
	}
);

/** an image which the sprites do not have: the neutral placeholder */
export const MissingImage = symbol('MissingImage', { 'icon-image': 'no-such-image' });

/** `meter_{status}`: the legend has no feature, so the first matching image stands for it */
export const TokenIcon = symbol('TokenIcon', { 'icon-image': 'meter_{status}' });

/** an icon and a label of the unvt glyphs: `{name}` has no value, so the sample is `Aa` */
export const IconAndText = symbol('IconAndText', {
	'icon-image': 'meter',
	'text-field': '{name}',
	'text-font': NOTO_REGULAR,
	'text-size': 13
});

const dot = { 'icon-image': 'circle', 'text-font': NOTO_REGULAR };
const numberLabel = ['to-string', ['get', NUMBER_FIELD]];

const stories = expressionStories(
	'symbol',
	{
		// the image and the color of the label switch by category; the label is the category
		Categorical: {
			layout: {
				'icon-image': categorical(['meter_on', 'meter_co', 'meter_avg'], 'meter'),
				'text-field': ['get', CATEGORY_FIELD],
				'text-font': NOTO_REGULAR,
				'text-size': 12
			},
			paint: { 'text-color': categorical([...PALETTE], '#555555') }
		},
		CategoricalCase: {
			layout: {
				'icon-image': categoricalCase(['meter_on', 'meter_co', 'meter_avg', 'meter'], 'circle_11')
			}
		},
		// the color of the SDF icon and of the label, and the icon size, linked to one field
		Graduated: {
			layout: { ...dot, 'icon-size': graduated([0.6, 0.8, 1, 1.2]), 'text-field': numberLabel },
			paint: {
				'icon-color': graduated(['#fcae91', '#fb6a4a', '#de2d26', '#a50f15']),
				'text-color': graduated(['#fcae91', '#fb6a4a', '#de2d26', '#a50f15'])
			}
		},
		Linear: { layout: dot, paint: { 'icon-color': linear(['#ffffcc', '#41b6c4', '#253494']) } },
		// icon size and label size
		LinearSize: {
			layout: {
				...dot,
				'icon-size': linear([0.5, 0.9, 1.4]),
				'text-field': 'Label',
				'text-size': linear([10, 14, 20])
			},
			paint: { 'icon-color': '#253494', 'text-color': '#253494' }
		},
		LinearExponential: {
			layout: { ...dot, 'icon-size': exponential([0.5, 0.9, 1.4]) },
			paint: { 'icon-color': legacyStops(['#c7e9c0', '#74c476', '#00441b']) }
		},
		ZoomAndData: {
			layout: { ...dot, 'icon-size': zoomAndData([0.5, 0.5, 0.5], [0.8, 1, 1.2], [0.4, 0.6]) },
			paint: { 'icon-color': PALETTE[1] }
		}
	},
	withLabels
);

export const Categorical = stories.Categorical;
export const CategoricalCase = stories.CategoricalCase;
export const Graduated = stories.Graduated;
export const Linear = stories.Linear;
export const LinearSize = stories.LinearSize;
export const LinearExponential = stories.LinearExponential;
export const ZoomAndData = stories.ZoomAndData;
export const CustomLabels = stories.CustomLabels;
