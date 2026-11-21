---
"@watergis/maplibre2svg": patch
"@watergis/legend-ui": patch
---

fix: show a placeholder icon when the icon of a symbol layer cannot be shown (#64)

- a `symbol` layer whose `icon-image` depends on the feature, such as `["get", "icon"]`, now gets a placeholder icon instead of no icon
- the placeholder of a missing or unencodable image is now a square with an exclamation mark, a `<g class="maplibre2svg-missing-icon">` whose color is `--maplibre2svg-missing-icon-color`. Any SVG icon can replace it through the CSS mask `--maplibre2svg-missing-icon`: show `.maplibre2svg-missing-icon-custom` and hide `.maplibre2svg-missing-icon-default`
- legend-ui: `--maplibregl-legend-icon-missing` (Lucide `square-exclamation-point` by default) and `--maplibregl-legend-missing-icon-color` set the icon and its color in the legend panel
