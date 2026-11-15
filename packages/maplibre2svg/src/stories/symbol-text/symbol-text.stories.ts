import type { Meta } from '@storybook/html-vite';
import {
	layerStory,
	typeMeta,
	type LayerParts,
	type TypeStoryArgs
} from '../utils/expression-stories';
import {
	NOTO_REGULAR,
	PROXIMA_BOLD,
	PROXIMA_REGULAR,
	ROBOTO_REGULAR,
	UNDP_GLYPHS,
	UNVT_GLYPHS
} from '../utils/fixtures/fonts';
import { storyImages } from '../utils/sprite';

export default { title: 'Layers/symbol text', ...typeMeta('symbol') } satisfies Meta<TypeStoryArgs>;

const unvt = () => ({ style: { glyphs: UNVT_GLYPHS } });
const undp = () => ({ options: storyImages(), style: { glyphs: UNDP_GLYPHS } });

/** A label in the glyphs of the unvt style */
const label = (
	name: string,
	layout: Record<string, unknown>,
	paint: Record<string, unknown> = {}
) => layerStory('symbol', name, { layout, paint } satisfies LayerParts, { setup: unvt });

/** a label in the glyphs of the unvt style (Noto Sans Regular) */
export const TextWithUnvtGlyphs = label('TextWithUnvtGlyphs', {
	'text-field': 'Nakuru',
	'text-font': NOTO_REGULAR,
	'text-size': 16
});

/** a label in the glyphs of the UNDP style (Proxima Nova Bold) */
export const TextWithUndpGlyphs = layerStory(
	'symbol',
	'TextWithUndpGlyphs',
	{
		layout: { 'text-field': 'Nairobi', 'text-font': PROXIMA_BOLD, 'text-size': 16 },
		paint: { 'text-color': '#405c78' }
	},
	{ setup: undp }
);

/** one text-size, with descenders: change `text-size` in the controls */
export const TextSize = label('TextSize', {
	'text-field': 'Typography',
	'text-font': NOTO_REGULAR,
	'text-size': 16
});

/** dark text with a white halo and a blur */
export const LightTextHalo = label(
	'LightTextHalo',
	{ 'text-field': 'Lake Nakuru', 'text-font': NOTO_REGULAR, 'text-size': 16 },
	{
		'text-color': '#1f4e79',
		'text-halo-color': '#ffffff',
		'text-halo-width': 2,
		'text-halo-blur': 1
	}
);

/** white text with a dark halo */
export const DarkTextHalo = label(
	'DarkTextHalo',
	{ 'text-field': 'Lake Nakuru', 'text-font': NOTO_REGULAR, 'text-size': 16 },
	{ 'text-color': '#ffffff', 'text-halo-color': '#222222', 'text-halo-width': 1.5 }
);

/** text-letter-spacing 0.2 em and text-transform uppercase */
export const LetterSpacingUppercase = label('LetterSpacingUppercase', {
	'text-field': 'Rift Valley',
	'text-font': NOTO_REGULAR,
	'text-size': 14,
	'text-letter-spacing': 0.2,
	'text-transform': 'uppercase'
});

/** a font stack of the unvt style: choose Noto Sans or Roboto in the `text-font` control */
export const FontStack = layerStory(
	'symbol',
	'FontStack',
	{ layout: { 'text-field': 'Quick fox Rg', 'text-font': NOTO_REGULAR, 'text-size': 18 } },
	{
		setup: unvt,
		args: { 'text-font': NOTO_REGULAR[0] },
		argTypes: {
			'text-font': { control: { type: 'select' }, options: [NOTO_REGULAR[0], ROBOTO_REGULAR[0]] }
		},
		// the control holds one font name; text-font is a font stack
		layer: (layer) => {
			const layout = (layer as { layout?: Record<string, unknown> }).layout ?? {};
			const font = layout['text-font'];
			return {
				...layer,
				layout: { ...layout, 'text-font': typeof font === 'string' ? [font] : font }
			} as typeof layer;
		}
	}
);

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
	{ setup: undp }
);

/**
 * a font the glyph server does not have in its glyphs, drawn as SVG text in a CSS font when the
 * `glyphs` control is off (`glyphs: false`), and from the glyphs when it is on
 */
export const CssFontFallback = layerStory(
	'symbol',
	'CssFontFallback',
	{ layout: { 'text-field': 'Mombasa', 'text-font': ['Noto Sans Italic'], 'text-size': 16 } },
	{
		setup: (args) => ({ ...unvt(), ...(args.glyphs ? {} : { options: { glyphs: false } }) }),
		args: { glyphs: false },
		argTypes: {
			glyphs: {
				control: 'boolean',
				description: 'Draw the text from the glyphs of the style (`glyphs` option)',
				table: { category: 'legend' }
			}
		}
	}
);

/** a font stack the glyph server does not have: SVG text in a CSS font */
export const UnknownFontStack = label('UnknownFontStack', {
	'text-field': 'Eldoret',
	'text-font': ['No Such Font Regular'],
	'text-size': 16
});

/** text which the font has no glyphs for: SVG text in a CSS font */
export const TextWithoutGlyphs = label('TextWithoutGlyphs', {
	'text-field': '東京',
	'text-font': NOTO_REGULAR,
	'text-size': 16
});
