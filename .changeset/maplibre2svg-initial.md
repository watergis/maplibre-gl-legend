---
"@watergis/maplibre2svg": minor
---

feat: first release of maplibre2svg, which draws legend symbols as SVG from the layers of a MapLibre style

- classifies each layer by its `match`, `case`, `step` and `interpolate` expressions (including zoom-nested ones) into classes, and evaluates the layer for a representative feature of each
- draws a symbol per class for fill, line, circle, fill-extrusion, background, symbol (sprite and SDF icons, labels from the style's glyphs), raster, hillshade, heatmap and color-relief layers
- one `LayerAdapter` per layer type, which hosts can add to or replace
- `legendToSvg` lays all legends out as one standalone SVG
