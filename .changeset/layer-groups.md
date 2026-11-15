---
"@watergis/maplibre-gl-legend": minor
---

feat: group layers in the legend (#27)

Layers in a group are listed under a collapsible group title. The group's eye toggle switches all of its layers on/off, and each layer keeps its own toggle. Click the group row to expand or collapse it. Layers in `groups` are shown even if they are not in `targets`, and their titles still come from `targets` (or the layer ID).

```ts
map.addControl(
	new MaplibreLegendControl(targets, {
		// group title and the IDs of its layers
		groups: {
			Pipeline: ['pipeline', 'pipeline_annotation'],
			'Water Facilities': ['wtp', 'wtp_annotation', 'tank', 'tank_annotation']
		},
		// other layers sharing the same source-layer are grouped by the source-layer name while 2 or more of them are listed (default: false)
		groupBySourceLayer: true,
		// groups start collapsed (default: false)
		collapseGroups: false
	})
);
```
