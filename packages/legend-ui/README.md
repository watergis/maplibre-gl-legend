# @watergis/legend-ui

Internal Svelte UI of the legend panel of [maplibre-gl-legend](https://github.com/watergis/maplibre-gl-legend/tree/main/packages/maplibre-gl-legend). It is bundled into `@watergis/maplibre-gl-legend` and not published on npm.

The panel lists the layers of the map as a tree: the symbol (or the chevron of a group) and the title of each row on the left, and the style editor button and the eye toggle on the right, the eye at the right end so that it is aligned in all rows. Groups of layers (the `groups` option) are nested to any depth, each level indented with a guide line.

## Usage

```ts
import { LegendPanel, type LegendSource } from '@watergis/legend-ui';

const source: LegendSource = {
	/* the layers, their visibility and their legend symbols, see src/lib/types/legend-source.ts */
};
const panel = new LegendPanel({
	target: container,
	source,
	targets: {},
	options: {
		groups: {
			'Water Facilities': { WTP: ['wtp', 'wtp_annotation'], Tank: ['tank', 'tank_annotation'] },
			Pipeline: ['pipeline', 'pipeline_annotation']
		}
	}
});
map.on('moveend', () => panel.refresh());
```

## Structure

- `src/lib/types/`: the options, `LegendGroups` and `LegendSource`.
- `src/lib/tree/`: the tree of layers and groups (`GroupTreeBuilder`) and the rows shown now (`buildLegendView`), without DOM.
- `src/lib/state/`: `LegendModel`, the state of the panel kept between refreshes.
- `src/lib/components/`: the Svelte components.
- `src/lib/legend.css`: the styles, with the class names and the `--maplibregl-legend-*` custom properties of maplibre-gl-legend.

## Development

```bash
pnpm storybook   # the stories, with a mock legend source (src/stories/mock-source.ts)
pnpm test        # the unit tests of the tree and the model
pnpm build       # svelte-package into dist/, used by maplibre-gl-legend
```
