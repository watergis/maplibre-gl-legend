import type { Meta } from '@storybook/html-vite';
import { createLegend, legendToSvg } from '../lib';
import { typeMetaArgs, type TypeStory, type TypeStoryArgs } from './expression-stories';
import { layerDetails, legendRows } from './render';
import { combine, GENERATED_IMAGES, loadStyle, UNDP_STYLE, UNVT_STYLE } from './sprite';

type Args = TypeStoryArgs & { titles: 'always' | 'multi' | 'never'; reverse: boolean };

export default {
	title: 'Example Maplibre Style',
	...typeMetaArgs,
	args: { ...typeMetaArgs.args, titles: 'multi', reverse: false },
	argTypes: {
		...typeMetaArgs.argTypes,
		titles: { control: 'inline-radio', options: ['always', 'multi', 'never'] },
		reverse: { control: 'boolean' }
	}
} satisfies Meta<Args>;

/** A link which saves the SVG as a file */
function downloadLink(svg: SVGSVGElement, name: string) {
	const text = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
	const link = document.createElement('a');
	link.href = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
	link.download = `${name}.svg`;
	link.textContent = `Download ${name}.svg`;
	link.style.display = 'inline-block';
	link.style.margin = '8px 0';
	return link;
}

/** `legendToSvg` of a whole real style, and the definition of every layer below it */
function combinedStory(url: string, name: string): TypeStory {
	return {
		render: (args) => {
			const a = args as Args;
			const root = document.createElement('div');
			root.style.fontFamily = 'sans-serif';
			root.textContent = 'Loading the style…';
			loadStyle(url)
				.then(async ({ style, images }) => {
					const options = {
						zoom: a.zoom,
						defaultLabel: a.defaultLabel,
						...combine(GENERATED_IMAGES, images)
					};
					const legends = await createLegend(style, options);
					const svg = legendToSvg(legends, {
						titles: a.titles,
						reverse: a.reverse,
						separator: true
					});
					const details = style.layers.map((layer, i) =>
						layerDetails(layer, legendRows(legends[i]), {
							zoom: a.zoom,
							defaultLabel: a.defaultLabel
						})
					);
					root.replaceChildren(
						downloadLink(svg, name),
						document.createElement('br'),
						svg,
						...details
					);
				})
				.catch((error: unknown) => (root.textContent = `Cannot load ${url}: ${String(error)}`));
			return root;
		}
	};
}

/** the whole unvt demo style */
export const UnvtStyle = combinedStory(UNVT_STYLE, 'unvt-legend');

/** the whole UNDP style 2.5.0 */
export const UndpStyle = combinedStory(UNDP_STYLE, 'undp-legend');
