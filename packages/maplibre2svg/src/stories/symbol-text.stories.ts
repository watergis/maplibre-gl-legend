import type { Meta } from '@storybook/html-vite';
import type { LayerSpecification } from 'maplibre-gl';
import {
	layerStory,
	storyLayer,
	typeMetaArgs,
	type TypeStory,
	type TypeStoryArgs
} from './expression-stories';
import {
	NOTO_REGULAR,
	PROXIMA_BOLD,
	PROXIMA_REGULAR,
	ROBOTO_REGULAR,
	UNDP_GLYPHS,
	UNVT_GLYPHS
} from './fixtures/fonts';
import { renderLayers, renderLegend } from './render';
import { storyImages } from './sprite';

export default { title: 'Layers/symbol text', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

const unvt = () => ({ style: { glyphs: UNVT_GLYPHS } });
const undp = () => ({ options: storyImages(), style: { glyphs: UNDP_GLYPHS } });

const label = (
	name: string,
	layout: Record<string, unknown>,
	paint: Record<string, unknown> = {}
) => storyLayer('symbol', name, { layout, paint });

/** a label in the glyphs of the unvt style (Noto Sans Regular) */
export const TextOnly = layerStory(
	'symbol',
	'TextOnly',
	{ layout: { 'text-field': 'Nakuru', 'text-font': NOTO_REGULAR, 'text-size': 16 } },
	unvt
);

/** a label in the glyphs of the UNDP style (Proxima Nova Bold) */
export const TextUndp = layerStory(
	'symbol',
	'TextUndp',
	{
		layout: { 'text-field': 'Nairobi', 'text-font': PROXIMA_BOLD, 'text-size': 16 },
		paint: { 'text-color': '#405c78' }
	},
	undp
);

/** text-size 10, 16 and 24, with descenders */
export const Sizes: TypeStory = {
	render: (args) =>
		renderLayers(
			[10, 16, 24].map((size) =>
				label(`Size${size}`, {
					'text-field': 'Typography',
					'text-font': NOTO_REGULAR,
					'text-size': size
				})
			),
			args,
			unvt()
		)
};

/** a white halo with blur, and a dark halo around light text */
export const Halo: TypeStory = {
	render: (args) =>
		renderLayers(
			[
				label(
					'HaloLight',
					{ 'text-field': 'Lake Nakuru', 'text-font': NOTO_REGULAR, 'text-size': 16 },
					{
						'text-color': '#1f4e79',
						'text-halo-color': '#ffffff',
						'text-halo-width': 2,
						'text-halo-blur': 1
					}
				),
				label(
					'HaloDark',
					{ 'text-field': 'Lake Nakuru', 'text-font': NOTO_REGULAR, 'text-size': 16 },
					{ 'text-color': '#ffffff', 'text-halo-color': '#222222', 'text-halo-width': 1.5 }
				)
			],
			args,
			unvt()
		)
};

/** text-letter-spacing 0.2 em and text-transform uppercase */
export const LetterSpacingUppercase = layerStory(
	'symbol',
	'LetterSpacingUppercase',
	{
		layout: {
			'text-field': 'Rift Valley',
			'text-font': NOTO_REGULAR,
			'text-size': 14,
			'text-letter-spacing': 0.2,
			'text-transform': 'uppercase'
		}
	},
	unvt
);

/** two font stacks of the unvt style: Noto Sans and Roboto */
export const FontStacks: TypeStory = {
	render: (args) =>
		renderLayers(
			[NOTO_REGULAR, ROBOTO_REGULAR].map((font) =>
				label(font[0].replace(/\s/g, ''), {
					'text-field': 'Quick fox Rg',
					'text-font': font,
					'text-size': 18
				})
			),
			args,
			unvt()
		)
};

/** an SDF icon of the UNDP sprite and a label of the UNDP glyphs */
export const IconAndText = layerStory(
	'symbol',
	'IconAndText',
	{
		layout: {
			'icon-image': 'marker',
			'text-field': 'Kisumu',
			'text-font': PROXIMA_REGULAR,
			'text-size': 14
		},
		paint: {
			'icon-color': '#006eb5',
			'text-color': '#006eb5',
			'text-halo-color': '#ffffff',
			'text-halo-width': 1
		}
	},
	undp
);

const fallbackLayer: LayerSpecification = label('CssFallback', {
	'text-field': 'Mombasa',
	'text-font': ['Noto Sans Italic'],
	'text-size': 16
});

/** the same layer with glyphs, and with `glyphs: false` (SVG text in a CSS font) */
export const CssFallback: TypeStory = {
	render: (args) => {
		const root = document.createElement('div');
		root.append(
			renderLegend(fallbackLayer, args, unvt()),
			renderLegend(fallbackLayer, args, { ...unvt(), options: { glyphs: false } })
		);
		return root;
	}
};

/** a font stack the glyph server does not have, and text the font has no glyphs for: CSS fonts */
export const MissingFont: TypeStory = {
	render: (args) =>
		renderLayers(
			[
				label('NoSuchFont', {
					'text-field': 'Eldoret',
					'text-font': ['No Such Font Regular'],
					'text-size': 16
				}),
				label('NoGlyphs', { 'text-field': '東京', 'text-font': NOTO_REGULAR, 'text-size': 16 })
			],
			args,
			unvt()
		)
};
