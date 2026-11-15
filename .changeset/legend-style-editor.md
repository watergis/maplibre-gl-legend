---
'@watergis/maplibre-gl-legend': minor
---

feat: add a style editor to change the style of a layer from the legend

- New `showStyleEditor` option: each layer has a palette button which opens the style editor.
- The editor is a non-modal dialog which stays inside the map. It edits opacity, colors, widths, sizes, etc. depending on the layer type, and each output of `interpolate` / `step` / `match` expressions.
- The manual editor edits the `paint` and `layout` properties as YAML or JSON. Symbol, circle and line layers can also add a heatmap layer.
- The UI is built with Svelte in the internal `@watergis/style-editor-ui` package and bundled into the plugin. Its styles are included in `maplibre-gl-legend.css` and can be themed with the `--gl-style-editor-*` CSS custom properties.
- The CSS is now built by Vite, and a minified `maplibre-gl-legend.min.css` is added.
