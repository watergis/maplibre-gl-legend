# @watergis/maplibre2svg

## 0.1.1

### Patch Changes

- 0c29db7: fix: show a placeholder icon when the icon of a symbol layer cannot be shown (#64)
  
  - a `symbol` layer whose `icon-image` depends on the feature, such as `["get", "icon"]`, now gets a placeholder icon instead of no icon
  - the placeholder of a missing or unencodable image is now a square with an exclamation mark, a `<g class="maplibre2svg-missing-icon">` whose color is `--maplibre2svg-missing-icon-color`. Any SVG icon can replace it through the CSS mask `--maplibre2svg-missing-icon`: show `.maplibre2svg-missing-icon-custom` and hide `.maplibre2svg-missing-icon-default`
  - legend-ui: `--maplibregl-legend-icon-missing` (Lucide `square-exclamation-point` by default) and `--maplibregl-legend-missing-icon-color` set the icon and its color in the legend panel

## 0.1.0

### Minor Changes

- 27d0744: feat: first release of maplibre2svg, which draws legend symbols as SVG from the layers of a MapLibre style
  
  - classifies each layer by its `match`, `case`, `step` and `interpolate` expressions (including zoom-nested ones) into classes, and evaluates the layer for a representative feature of each
  - draws a symbol per class for fill, line, circle, fill-extrusion, background, symbol (sprite and SDF icons, labels from the style's glyphs), raster, hillshade, heatmap and color-relief layers
  - one `LayerAdapter` per layer type, which hosts can add to or replace
  - `legendToSvg` lays all legends out as one standalone SVG
