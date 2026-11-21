# maplibre-gl-legend

![licence](https://img.shields.io/github/license/watergis/maplibre-gl-legend)
[![version](https://img.shields.io/npm/v/@watergis/maplibre-gl-legend.svg)](https://www.npmjs.com/package/@watergis/maplibre-gl-legend)

This module adds legend control which is able to create legend panel from mapbox style to maplibre-gl. It was forked from [mapbox-gl-legend](https://github.com/watergis/mapbox-gl-legend).

Legend symbols are drawn as SVG from the map's style by [maplibre2svg](../maplibre2svg/README.md) (bundled in this package).

## Installation:

```bash
pnpm i -D @watergis/maplibre-gl-legend maplibre-gl
```

## Demo:

Try [codesandbox](https://codesandbox.io/s/mapbox-gl-legend-0x6f0).

See [demo](https://maplibre-gl-legend.water-gis.com).

See [API reference](https://maplibre-gl-legend.water-gis.com/api) for all classes and options.

![demo.gif](./demo.gif)

## Usage:

```ts
import { MaplibreLegendControl } from "@watergis/maplibre-gl-legend";
import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map();
//please add legend control after loading mapbox stylefiles, otherwise it causes errors...
map.on('load', function() {
const targets = {
  'pipeline': 'Pipeline',
  'pipeline_annotation': 'Pipeline Label', 
  'meter': 'Water Meter',
  'flow meter': 'Flow Meter', 
  'valve': 'Valve', 
  'firehydrant': 'Fire Hydrant', 
  'washout': 'Washout',
  'tank': 'Tank', 
  'tank_annotation': 'Tank Label', 
  'wtp': 'WTP', 
  'wtp_annotation': 'WTP Label', 
  'intake': 'Intake', 
  'intake_annotation': 'Intake Label', 
  'parcels': 'Parcels', 
  'parcels_annotation': 'Parcels Label', 
  'village': 'Village', 
  'village_annotation': 'Village Label', 
  'dma': 'DMA',
  'dma_annotation': 'DMA Label', 
};

// add legend control without checkbox, and it will be hide as default
map.addControl(new MaplibreLegendControl(targets, {showDefault: false, showCheckbox: false, onlyRendered: false }), 'top-right');

// add legend control with checkbox, and it will be shown as default
map.addControl(new MaplibreLegendControl(targets, {showDefault: true}), 'bottom-right');

// add legend control with all layers, and it reverse layer order
map.addControl(new MaplibreLegendControl({}, {reverseOrder: false}), 'bottom-left');

// group layers: layers in a group are listed under the group title, and switched on/off together
map.addControl(new MaplibreLegendControl(targets, {
  groups: {
    'Pipeline': ['pipeline', 'pipeline_annotation'],
    // groups can be nested to any depth: an object of groups in place of the array of layer IDs
    'Water Facilities': {
      'WTP': ['wtp', 'wtp_annotation'],
      'Tank': ['tank', 'tank_annotation'],
    },
    // or groups in the array next to layer IDs
    'All Points': [{ 'Some Points': ['points-halo', 'points-circles'] }, 'points-symbols'],
  },
}), 'top-left');
});
```

Specify your layers which you want to add the legend by the control.

### Options

All options are optional. See [LegendOptions in the API reference](https://maplibre-gl-legend.water-gis.com/api) for the details.

- showDefault
  - true: Legend will be shown as default
  - false: Legend will be hide as default
  - default value is `true` if you don't specify the option.
- showCheckbox
  - true: the checkbox (eye icon) for switching visibility will be added at the right end of each row as default
  - false: the checkbox will not be added as default
  - default value is `true` if you don't specify the option.
- reverseOrder
  - true: layers will be ordered from top. 
  - false: layers will be ordered from bottom. 
  - default value is `true` if you don't specfify the option.
- onlyRendered
  - true: only rendered layers will be shown on legend as default. 
  - false: all layers' legend will be shown as default. 
  - default value will be true.
- title
  - the text shown above the icons
  - default: "Legend"
- onlyRenderedLabel
  - the label text of the "Only rendered" checkbox. Use it to translate the label into other languages.
  - default: "Only rendered"
- groups
  - groups of layers: an object of the group title and the IDs of the layers in the group. e.g. `{ 'Pipeline': ['pipeline', 'pipeline_annotation'] }`
  - the layers of a group are listed under the group title. The checkbox of the group switches all of its layers on/off, and each layer still has its own checkbox. Click the group row (title or chevron) to collapse or expand the group.
  - a layer in a group but not in `targets` is not listed, but the checkbox of the group still switches it on/off (e.g. a label layer switched with its features). With an empty `targets` (`{}`), all layers are listed. A layer belongs to the first group listing it.
  - a group with only one layer in `targets` (its other layers are not in `targets`) is shown as a single layer row without the group title. The checkbox of the row still switches all layers of the group on/off. A group with 2 or more layers in `targets` stays a group even if only one of them is rendered with `onlyRendered`.
  - groups can be nested to any depth. The members of a group are either:
    - an array of layer IDs, which can also have objects of nested groups, e.g. `{ 'All Points': [{ 'Some Points': ['points-halo', 'points-circles'] }, 'points-symbols'] }`
    - an object of nested groups, e.g. `{ 'Water Facilities': { 'WTP': ['wtp', 'wtp_annotation'], 'Tank': ['tank', 'tank_annotation'] } }`
  - the legend is shown as a tree: the chevron of a group and the title on the left, the style editor button (with `showStyleEditor`) and the checkbox on the right, the checkbox at the right end. A nested group is indented inside its parent, at the position of its first layer. The checkbox of a group switches the layers of all its nested groups too, and collapsing a group hides all of them. The rules above apply to nested groups as well, counting the layers of their nested groups.
  - the type of the option is exported as `LegendGroups`.
  - default: no group
- groupBySourceLayer
  - true: layers not in `groups` which share the same source and `source-layer` are grouped automatically, titled by the source-layer name. They are grouped only while 2 or more of them are listed (e.g. with `onlyRendered`, a layer not rendered at the current zoom is not counted).
  - false: layers are not grouped automatically.
  - default value is `false`.
- collapseGroups
  - true: groups are collapsed as default.
  - false: groups are expanded as default.
  - default value is `false`.
- showStyleEditor
  - true: each layer has a palette button which opens the style editor, a dialog to change the style of the layer on the map:
    - **Properties**: opacity, colors, widths, sizes, halos, etc. depending on the layer type. A property set by a zoom or data expression (`interpolate`, `step`, `match`) is edited output by output.
    - **Manual editor**: the `paint` and `layout` properties of the layer as YAML or JSON.
    - **Heatmap**: symbol, circle and line layers can add a heatmap layer made from their features.
    - **Reset**: restores the style the layer had when the dialog was opened for it.
  - the dialog is not modal: the map can be moved while it is open, and the legend shows the changes at once. It opens in the top corner of the map opposite to the control, and can be moved inside the map by dragging its header. It is not higher than the map: its contents scroll.
  - default value is `false`.

### Customizing styles

The icons (layer visibility eye / eye-off, close button) and the "Only rendered" switch are drawn entirely by CSS, using [Lucide](https://lucide.dev) icons by default. Override the CSS custom properties on `.maplibregl-legend-list` to change them. Icons are applied as CSS masks, so only their shape is used; set their color with the color properties.

| Property | Default | Description |
| --- | --- | --- |
| `--maplibregl-legend-icon-visible` | Lucide `eye` | icon of a visible layer |
| `--maplibregl-legend-icon-hidden` | Lucide `eye-off` | icon of a hidden layer |
| `--maplibregl-legend-icon-close` | Lucide `x` | icon of the close button |
| `--maplibregl-legend-icon-chevron` | Lucide `chevron-down` | icon of the button collapsing a group |
| `--maplibregl-legend-icon-size` | `16px` | size of the visibility icons |
| `--maplibregl-legend-icon-color` | `#1c1c1c` | color of the visible icon |
| `--maplibregl-legend-icon-hidden-color` | `#9a9a9a` | color of the hidden icon |
| `--maplibregl-legend-icon-partial-color` | `#9a9a9a` | color of the visible icon of a partially visible group |
| `--maplibregl-legend-close-icon-size` | `16px` | size of the close icon |
| `--maplibregl-legend-close-icon-color` | `#1c1c1c` | color of the close icon |
| `--maplibregl-legend-icon-style` | Lucide `palette` | icon of the button opening the style editor |
| `--maplibregl-legend-style-icon-color` | `#6b6b6b` | color of the style editor button |
| `--maplibregl-legend-style-icon-hover-color` | `--maplibregl-legend-focus-color` | color of the style editor button on hover |
| `--maplibregl-legend-switch-width` | `28px` | width of the switch |
| `--maplibregl-legend-switch-height` | `16px` | height of the switch |
| `--maplibregl-legend-switch-thumb-size` | `12px` | size of the switch knob |
| `--maplibregl-legend-switch-on-color` | `#3b82f6` | switch color when on |
| `--maplibregl-legend-switch-off-color` | `#c4c4c4` | switch color when off |
| `--maplibregl-legend-switch-thumb-color` | `#ffffff` | color of the switch knob |
| `--maplibregl-legend-divider` | `1px solid #e5e5e5` | line between layers |
| `--maplibregl-legend-group-divider` | `none` | line between the rows in a group (none: the rows are tied by the tree guides) |
| `--maplibregl-legend-group-divider-inset` | `8px` | how much shorter the line between the rows in a group is, on each side |
| `--maplibregl-legend-group-indent` | `--maplibregl-legend-icon-size` + `4px` | how much each level of the tree is indented |
| `--maplibregl-legend-tree-guide-color` | `#e5e5e5` | color of the vertical lines guiding the levels of the tree (`transparent`: no line) |
| `--maplibregl-legend-text-color` | `#1c1c1c` | text color |
| `--maplibregl-legend-focus-color` | `#3b82f6` | keyboard focus outline color |

```css
.maplibregl-legend-list {
	--maplibregl-legend-icon-color: #0f766e;
	--maplibregl-legend-switch-on-color: #0f766e;
	--maplibregl-legend-divider: 1px dashed #ccc;
	/* any SVG works as an icon */
	--maplibregl-legend-icon-close: url('./my-close-icon.svg');
}
```

#### Style editor

The style editor (`showStyleEditor`) is built with Svelte and its styles are included in `maplibre-gl-legend.css` (a minified `maplibre-gl-legend.min.css` is also available). Its look is driven by the `--gl-style-editor-*` custom properties: the [Tailwind CSS colors](https://tailwindcss.com/docs/colors) as the palette, and [shadcn/ui](https://ui.shadcn.com/docs/theming) names for the roles (`background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, ...). Override them on `.gl-style-editor-dialog`:

```css
.gl-style-editor-dialog {
	--gl-style-editor-primary: #0f766e;
	--gl-style-editor-radius: 4px;
	--gl-style-editor-font: 'Inter', sans-serif;
	--gl-style-editor-width: 380px;
}
```

Every element of the dialog has a `gl-style-editor-*` class. The rules of the components are scoped, so a rule overriding one of them needs one more class, e.g. `.gl-style-editor-dialog .gl-style-editor-btn--primary`. The dialog follows the `color-scheme` of the page for light / dark (e.g. `:root { color-scheme: light dark; }`). See the comment at the top of `maplibre-gl-legend.css` for the full list, and how to replace its icons.

### Use CDN

maplibre-gl v6 is distributed as ES modules only, so load both maplibre-gl and this plugin with `<script type="module">`.

```html
<link href='https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.css' rel='stylesheet' />
<link href='https://www.unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.css' rel='stylesheet' />
<script type="module">
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.mjs';
import { MaplibreLegendControl } from 'https://www.unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.es.js';

const map = new maplibregl.Map({ /* your map options */ });

map.on('load', function() {
    const targets = {
        'pipeline': 'Pipeline',
        'pipeline_annotation': 'Pipeline Label', 
        'meter': 'Water Meter',
        'flow meter': 'Flow Meter', 
        'valve': 'Valve', 
        'firehydrant': 'Fire Hydrant', 
        'washout': 'Washout',
        'tank': 'Tank', 
        'tank_annotation': 'Tank Label', 
        'wtp': 'WTP', 
        'wtp_annotation': 'WTP Label', 
        'intake': 'Intake', 
        'intake_annotation': 'Intake Label', 
        'parcels': 'Parcels', 
        'parcels_annotation': 'Parcels Label', 
        'village': 'Village', 
        'village_annotation': 'Village Label', 
        'dma': 'DMA',
        'dma-annotation': 'DMA Label', 
        'contour-line': 'Countour',
        'contour-label': 'Contour Label',
        'hillshade': 'Hillshade'
    };
    map.addControl(new MaplibreLegendControl(targets, {
        showDefault: false, 
        showCheckbox: false, 
        onlyRendered: true,
        reverseOrder: true
    }), 'top-right');
})
</script>
```

Furthermore, you may download specific version's scripts and css locally from [NPM](https://www.npmjs.com/package/@watergis/maplibre-gl-legend) page.

See an example HTML at [index_es.html](./index_es.html)

## Development

```
pnpm lint
pnpm format
pnpm dev
```

open [http://localhost:5173](http://localhost:5173).

If there are any changes on source code, it will be reflected automatically.

## Build package

```
pnpm build
```

The modules will be generated under `dist` folder.
