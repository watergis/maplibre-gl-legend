# maplibre-gl-legend

![licence](https://img.shields.io/github/license/watergis/maplibre-gl-legend)
[![version](https://img.shields.io/npm/v/@watergis/maplibre-gl-legend.svg)](https://www.npmjs.com/package/@watergis/maplibre-gl-legend)

A legend control for [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/). It is made from the style of the map.

- Each layer is listed with its symbol, drawn as SVG from its style. A layer styled by data (`match`, `step`, `interpolate`, ...) gets a symbol per class.
- A visibility toggle (eye) shows / hides each layer.
- "Only rendered" lists only the layers rendered in the current view.
- Groups of layers, nested to any depth, are shown as a tree.
- An optional style editor changes the colors, widths, sizes, ... of a layer from the legend.

The symbols are drawn by [maplibre2svg](https://github.com/watergis/maplibre-gl-legend/tree/main/packages/maplibre2svg). The legend panel and the style editor are Svelte components ([legend-ui](https://github.com/watergis/maplibre-gl-legend/tree/main/packages/legend-ui), [style-editor-ui](https://github.com/watergis/maplibre-gl-legend/tree/main/packages/style-editor-ui)). All three are bundled in this package.

- Demo: <https://maplibre-gl-legend.water-gis.com>
- API reference: <https://maplibre-gl-legend.water-gis.com/api>
- Storybook: <https://maplibre-gl-legend.water-gis.com/stories>

![demo.gif](./demo.gif)

## Installation

```bash
pnpm i @watergis/maplibre-gl-legend maplibre-gl
```

`maplibre-gl` (`^6.4.1`) is a peer dependency.

## Usage

Add the control after the style is loaded (e.g. in the `load` event).

```ts
import maplibregl from 'maplibre-gl';
import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';
import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';

const map = new maplibregl.Map({
	/* your map options */
});

map.on('load', () => {
	// the layers listed in the legend: layer ID and its title
	const targets = {
		pipeline: 'Pipeline',
		pipeline_annotation: 'Pipeline Label',
		wtp: 'WTP',
		wtp_annotation: 'WTP Label',
		tank: 'Tank',
		tank_annotation: 'Tank Label'
	};
	map.addControl(new MaplibreLegendControl(targets), 'top-right');
});
```

- The layers are listed in the order of the style, not in the order of `targets`.
- Pass an empty object (`{}`) to list all layers of the style, titled by their IDs.

### Examples

```ts
// closed at first (a legend button opens it), without the toggles, listing all layers in targets
map.addControl(
	new MaplibreLegendControl(targets, { showDefault: false, showCheckbox: false, onlyRendered: false }),
	'top-right'
);

// all layers of the style, in the order of style.layers
map.addControl(new MaplibreLegendControl({}, { reverseOrder: false }), 'bottom-left');

// groups of layers, nested to any depth, and the style editor
map.addControl(
	new MaplibreLegendControl(targets, {
		groups: {
			Pipeline: ['pipeline', 'pipeline_annotation'],
			'Water Facilities': {
				WTP: ['wtp', 'wtp_annotation'],
				Tank: ['tank', 'tank_annotation']
			}
		},
		showStyleEditor: true
	}),
	'top-left'
);
```

## Options

All options are optional.

| Option               | Default           | Description                                                                                                          |
| -------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `showDefault`        | `true`            | `true`: the panel is open, until its close button is clicked. `false`: a legend button opens it, and a click outside the control closes it. |
| `showCheckbox`       | `true`            | A visibility toggle (eye) at the right end of each row and group. Toggles of the same layer in other legend controls follow each other. |
| `reverseOrder`       | `true`            | `true`: the top-most layer (the last one of `style.layers`) comes first. `false`: the order of `style.layers`.       |
| `onlyRendered`       | `true`            | The initial state of the "Only rendered" switch. When it is on, only the layers rendered in the view are listed, plus the layers hidden with a toggle, so that they can be shown again. |
| `title`              | `'Legend'`        | The title at the top of the panel.                                                                                   |
| `onlyRenderedLabel`  | `'Only rendered'` | The label of the "Only rendered" switch, e.g. to translate it.                                                       |
| `groups`             | none              | Groups of layers, nested to any depth. See [Groups](#groups).                                                        |
| `groupBySourceLayer` | `false`           | Groups the layers that are not in `groups` and share a source and `source-layer`, titled by the source-layer. A group is made only while 2 or more of its layers are listed. |
| `collapseGroups`     | `false`           | Shows the groups collapsed at first, at every level. The state the user sets is kept while the legend is updated.     |
| `showStyleEditor`    | `false`           | A palette button at the left of the eye opens the style editor of the layer. See [Style editor](#style-editor).       |

The legend is updated when the map moves and when the style changes. If your code changes something the legend shows (e.g. the visibility of a layer), call `redraw()`.

### Groups

Layers in a group are listed under the group title. The members of a group are either:

- an array of layer IDs, which can also contain objects of nested groups
- an object of nested groups

```ts
import type { LegendGroups } from '@watergis/maplibre-gl-legend';

const groups: LegendGroups = {
	// a group of layers
	Pipeline: ['pipeline', 'pipeline_annotation'],
	// a group of groups
	'Water Facilities': {
		WTP: ['wtp', 'wtp_annotation'],
		Tank: ['tank', 'tank_annotation']
	},
	// a group of layers and groups
	'All Points': [{ 'Some Points': ['points-halo', 'points-circles'] }, 'points-symbols']
};
```

The legend is shown as a tree.

- **Layout**
  - A nested group is indented inside its parent, with a guide line.
  - A group is placed at the position of its first layer.
  - Click a group row (title or chevron) to collapse or expand it. Collapsing a group hides all of its nested groups.
- **Toggles**
  - The eye of a group switches all of its layers, including those of its nested groups.
  - It is shown gray when only some of the layers are visible.
  - Each layer keeps its own eye.
- **Layers not in `targets`**
  - A layer in a group but not in `targets` is not listed, but its group still switches it (e.g. a label layer switched with its features).
  - With an empty `targets` (`{}`), all layers are listed.
- **Single-layer and empty groups**
  - A group with only one layer in `targets` is shown as that layer's row, whose eye switches the whole group.
  - A group with 2 or more layers in `targets` stays a group, even if only one of them is rendered with `onlyRendered`.
  - A group with no layer listed is not shown.
- **Which group a layer belongs to**
  - A layer belongs to the first group listing it.
  - Groups of the same title in different parents are different groups.

### Style editor

With `showStyleEditor: true`, the palette button of a layer opens a dialog to change the style of the layer on the map:

- **Properties**: opacity, colors, widths, sizes, halos, ... depending on the layer type. A property set by a zoom or data expression (`interpolate`, `step`, `match`) is edited output by output.
- **Manual editor**: the `paint` and `layout` properties of the layer as YAML or JSON.
- **Heatmap**: symbol, circle and line layers can add a heatmap layer made from their features.
- **Reset**: restores the style the layer had when the dialog was opened for it.

The dialog is not modal: the map can be moved while it is open, and the legend shows the changes at once. It opens in the top corner of the map opposite to the control. It can be moved inside the map by dragging its header, and its contents scroll when it is higher than the map.

## Customizing styles

`maplibre-gl-legend.css` has the styles of the legend and of the style editor. `maplibre-gl-legend.min.css` is a minified copy.

### Legend

The icons (eye / eye-off, chevron, palette, close) and the "Only rendered" switch are drawn by CSS, with [Lucide](https://lucide.dev) icons by default. Override the custom properties on `.maplibregl-legend-list`. Icons are CSS masks: only their shape is used, and their color comes from the color properties.

```css
.maplibregl-legend-list {
	--maplibregl-legend-icon-color: #0f766e;
	--maplibregl-legend-switch-on-color: #0f766e;
	--maplibregl-legend-divider: 1px dashed #ccc;
	/* a wider indent, and no guide lines */
	--maplibregl-legend-group-indent: 28px;
	--maplibregl-legend-tree-guide-color: transparent;
	/* any SVG works as an icon */
	--maplibregl-legend-icon-close: url('./my-close-icon.svg');
}
```

| Property                                     | Default                                 | Description                                                             |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `--maplibregl-legend-icon-visible`           | Lucide `eye`                            | Icon of a visible layer or group.                                       |
| `--maplibregl-legend-icon-hidden`            | Lucide `eye-off`                        | Icon of a hidden layer or group.                                        |
| `--maplibregl-legend-icon-close`             | Lucide `x`                              | Icon of the close button.                                               |
| `--maplibregl-legend-icon-chevron`           | Lucide `chevron-down`                   | Icon of the button collapsing a group.                                  |
| `--maplibregl-legend-icon-style`             | Lucide `palette`                        | Icon of the style editor button.                                        |
| `--maplibregl-legend-icon-size`              | `16px`                                  | Size of the eye, chevron and palette icons.                             |
| `--maplibregl-legend-icon-color`             | `#1c1c1c`                               | Color of the visible eye and the chevron.                               |
| `--maplibregl-legend-icon-hidden-color`      | `#9a9a9a`                               | Color of the hidden eye.                                                |
| `--maplibregl-legend-icon-partial-color`     | `#9a9a9a`                               | Color of the eye of a partially visible group.                          |
| `--maplibregl-legend-close-icon-size`        | `16px`                                  | Size of the close icon.                                                 |
| `--maplibregl-legend-close-icon-color`       | `#1c1c1c`                               | Color of the close icon.                                                |
| `--maplibregl-legend-style-icon-color`       | `#6b6b6b`                               | Color of the style editor button.                                       |
| `--maplibregl-legend-style-icon-hover-color` | `--maplibregl-legend-focus-color`       | Color of the style editor button on hover.                              |
| `--maplibregl-legend-switch-width`           | `28px`                                  | Width of the switch.                                                    |
| `--maplibregl-legend-switch-height`          | `16px`                                  | Height of the switch.                                                   |
| `--maplibregl-legend-switch-thumb-size`      | `12px`                                  | Size of the knob of the switch.                                         |
| `--maplibregl-legend-switch-on-color`        | `#3b82f6`                               | Color of the switch when on.                                            |
| `--maplibregl-legend-switch-off-color`       | `#c4c4c4`                               | Color of the switch when off.                                           |
| `--maplibregl-legend-switch-thumb-color`     | `#ffffff`                               | Color of the knob.                                                      |
| `--maplibregl-legend-divider`                | `1px solid #e5e5e5`                     | Line between the top-level layers and groups.                           |
| `--maplibregl-legend-group-divider`          | `none`                                  | Line between the rows of a group.                                       |
| `--maplibregl-legend-group-divider-inset`    | `8px`                                   | How much shorter the line between the rows of a group is, on each side. |
| `--maplibregl-legend-group-indent`           | `--maplibregl-legend-icon-size` + `4px` | How much each level of the tree is indented.                            |
| `--maplibregl-legend-tree-guide-color`       | `#e5e5e5`                               | Color of the vertical guide lines (`transparent`: no line).             |
| `--maplibregl-legend-text-color`             | `#1c1c1c`                               | Color of the titles and labels.                                         |
| `--maplibregl-legend-focus-color`            | `#3b82f6`                               | Color of the keyboard focus outline.                                    |

For rules the custom properties do not cover, see the [elements and classes of the panel](https://github.com/watergis/maplibre-gl-legend/tree/main/packages/legend-ui#elements) in the README of legend-ui.

### Style editor dialog

The look of the style editor is driven by the `--gl-style-editor-*` custom properties. The palette is the [Tailwind CSS colors](https://tailwindcss.com/docs/colors), and the roles use [shadcn/ui](https://ui.shadcn.com/docs/theming) names (`background`, `foreground`, `primary`, `muted`, `border`, `input`, `ring`, ...). Override them on `.gl-style-editor-dialog`:

```css
.gl-style-editor-dialog {
	--gl-style-editor-primary: #0f766e;
	--gl-style-editor-radius: 4px;
	--gl-style-editor-font: 'Inter', sans-serif;
	--gl-style-editor-width: 380px;
}
```

- Every element of the dialog has a `gl-style-editor-*` class.
- The rules of the components are scoped, so a rule overriding one of them needs one more class, e.g. `.gl-style-editor-dialog .gl-style-editor-btn--primary`.
- The dialog follows the `color-scheme` of the page for light / dark (e.g. `:root { color-scheme: light dark; }`).
- See the comment at the top of `maplibre-gl-legend.css` for how to replace its icons.

## Use from a CDN

maplibre-gl v6 is distributed as ES modules only, so load both maplibre-gl and this plugin with `<script type="module">`.

```html
<link href="https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.css" rel="stylesheet" />
<link
	href="https://unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.css"
	rel="stylesheet"
/>
<script type="module">
	import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.mjs';
	import { MaplibreLegendControl } from 'https://unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.es.js';

	const map = new maplibregl.Map({
		/* your map options */
	});

	map.on('load', () => {
		const targets = { pipeline: 'Pipeline', wtp: 'WTP', tank: 'Tank' };
		map.addControl(new MaplibreLegendControl(targets, { showDefault: false }), 'top-right');
	});
</script>
```

See [index_es.html](./index_es.html) for a full example. The scripts and CSS of each version can also be downloaded from [npm](https://www.npmjs.com/package/@watergis/maplibre-gl-legend).

## Development

```bash
pnpm dev     # the example page on http://localhost:5173, reloaded on changes
pnpm lint
pnpm format
pnpm build   # the modules into dist/
```

The example page ([index.ts](./index.ts)) uses the built `@watergis/legend-ui` and `@watergis/style-editor-ui`. Run `pnpm build` at the repository root first, and again after changing them.
