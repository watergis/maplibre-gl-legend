---
'@watergis/maplibre-gl-legend': patch
---

fix: the close button no longer overlaps the scrollbar. Only the layer table scrolls now, so the title, the "Only rendered" checkbox and the close button stay visible. The scrollbar is shown only when needed.

Note: the scroll container moved from `.maplibregl-legend-list` to the new `.maplibregl-legend-table-wrapper`. If you override `max-height` or `overflow` in your own CSS, apply it to `.maplibregl-legend-table-wrapper` instead.
