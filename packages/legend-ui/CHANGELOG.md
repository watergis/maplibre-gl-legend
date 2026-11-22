# @watergis/legend-ui

## 0.2.0

### Minor Changes

- 5640f92: fix: limit the width of the legend panel, and wrap long labels
  
  - the panel is at most `--maplibregl-legend-max-width` wide (`320px` by default). Labels longer than the panel wrap onto several lines.
  - the classes of a layer styled by data are shown as a row per class (`li.maplibregl-legend-class`) instead of one SVG, so their labels fit the panel. `LayerSymbol` of type `classes` now has `classes: { svg, label }[]` instead of `svg`.

## 0.1.0

### Minor Changes

- 2d83c54: feat: the Svelte UI of the legend panel of maplibre-gl-legend
  
  An internal package, bundled into `@watergis/maplibre-gl-legend` and not published on npm.
  
  - `LegendPanel` mounts the panel (title, close button, "Only rendered" switch and the tree of layers and groups) into a control element, and updates it from a `LegendSource`, the interface of what the panel needs from the map: the layers, the rendered layers, their visibility and their legend symbols.
  - The `groups` option is nested to any depth (`LegendGroups`). `GroupTreeBuilder` and `buildLegendView` make the tree and its rows without DOM, and `LegendModel` keeps the state of the panel between refreshes.
  - The components are `LegendTree`, `TreeNode`, `TreeGroup`, `TreeLayer`, `TreeRow`, `VisibilityToggle`, `LayerSymbol` and `OnlyRenderedSwitch`, each with stories in Storybook.
  - The styles (`legend.css`) use the class names and the `--maplibregl-legend-*` custom properties of maplibre-gl-legend.

### Patch Changes

- 0c29db7: fix: show a placeholder icon when the icon of a symbol layer cannot be shown (#64)
  
  - a `symbol` layer whose `icon-image` depends on the feature, such as `["get", "icon"]`, now gets a placeholder icon instead of no icon
  - the placeholder of a missing or unencodable image is now a square with an exclamation mark, a `<g class="maplibre2svg-missing-icon">` whose color is `--maplibre2svg-missing-icon-color`. Any SVG icon can replace it through the CSS mask `--maplibre2svg-missing-icon`: show `.maplibre2svg-missing-icon-custom` and hide `.maplibre2svg-missing-icon-default`
  - legend-ui: `--maplibregl-legend-icon-missing` (Lucide `square-exclamation-point` by default) and `--maplibregl-legend-missing-icon-color` set the icon and its color in the legend panel
