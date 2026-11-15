# @watergis/mapbox-gl-legend

## 2.0.1

### Patch Changes

- a3b3175: fix: the options of `MapboxLegendControl` are optional, as in `MaplibreLegendControl`
  
  `new MapboxLegendControl(targets, { reverseOrder: false })` now type-checks: omitted options use their default values.

## 2.0.0

### Major Changes

- 39c8aaa: feat: mapbox-gl-legend is moved to maplibre-gl-legend monorepo.
  
  - support Mapbox GL JS v3 (`mapbox-gl` is now a peer dependency `^3.0.0`)
  - the package is now published as an ES module to npm registry
  - `accesstoken` option was renamed to `accessToken`
  - `axios` dependency was removed
