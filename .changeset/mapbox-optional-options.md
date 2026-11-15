---
"@watergis/mapbox-gl-legend": patch
---

fix: the options of `MapboxLegendControl` are optional, as in `MaplibreLegendControl`

`new MapboxLegendControl(targets, { reverseOrder: false })` now type-checks: omitted options use their default values.