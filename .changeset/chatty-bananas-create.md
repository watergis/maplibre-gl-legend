---
"@watergis/maplibre-gl-legend": patch
---

fix: layers in `groups` but not in `targets` are no longer listed in the legend

- the toggle of the group still shows / hides them
- a group with only one layer in `targets` is shown as a single layer row, whose toggle shows / hides all layers of the group
- a group with 2+ layers in `targets` stays a group, even if only one of them is rendered with `onlyRendered`
