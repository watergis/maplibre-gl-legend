---
"@watergis/legend-ui": minor
---

feat: the Svelte UI of the legend panel of maplibre-gl-legend

An internal package, bundled into `@watergis/maplibre-gl-legend` and not published on npm.

- `LegendPanel` mounts the panel (title, close button, "Only rendered" switch and the tree of layers and groups) into a control element, and updates it from a `LegendSource`, the interface of what the panel needs from the map: the layers, the rendered layers, their visibility and their legend symbols.
- The `groups` option is nested to any depth (`LegendGroups`). `GroupTreeBuilder` and `buildLegendView` make the tree and its rows without DOM, and `LegendModel` keeps the state of the panel between refreshes.
- The components are `LegendTree`, `TreeNode`, `TreeGroup`, `TreeLayer`, `TreeRow`, `VisibilityToggle`, `LayerSymbol` and `OnlyRenderedSwitch`, each with stories in Storybook.
- The styles (`legend.css`) use the class names and the `--maplibregl-legend-*` custom properties of maplibre-gl-legend.
