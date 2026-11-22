---
"@watergis/legend-ui": minor
"@watergis/maplibre-gl-legend": patch
---

fix: limit the width of the legend panel, and wrap long labels

- the panel is at most `--maplibregl-legend-max-width` wide (`320px` by default). Labels longer than the panel wrap onto several lines.
- the classes of a layer styled by data are shown as a row per class (`li.maplibregl-legend-class`) instead of one SVG, so their labels fit the panel. `LayerSymbol` of type `classes` now has `classes: { svg, label }[]` instead of `svg`.
