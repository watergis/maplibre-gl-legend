---
"@watergis/maplibre-gl-legend": minor
---

feat: nested groups, and the legend shown as a tree view

Groups can be nested to any depth: the members of a group are an array of layer IDs (which can also contain objects of groups), or an object of groups.

```ts
map.addControl(
	new MaplibreLegendControl(targets, {
		groups: {
			Pipeline: ['pipeline', 'pipeline_annotation'],
			'Water Facilities': {
				WTP: ['wtp', 'wtp_annotation'],
				Tank: ['tank', 'tank_annotation']
			},
			'All Points': [{ 'Some Points': ['points-halo', 'points-circles'] }, 'points-symbols']
		}
	})
);
```

- The legend is a tree: each level is indented with a guide line. A row consists of chevron icon, title, style icon and eye icon, so the eyes of all rows are aligned at the right end.
- The toggle of a group switches the layers of all its nested groups. Collapsing a group hides them all.
- The type of the option is exported as `LegendGroups`.
- New CSS custom properties: `--maplibregl-legend-group-indent` and `--maplibregl-legend-tree-guide-color`. The lines between the rows of a group are off by default (`--maplibregl-legend-group-divider: none`).

```css
.maplibregl-legend-list {
	--maplibregl-legend-group-indent: 28px;
	--maplibregl-legend-tree-guide-color: transparent; /* no guide lines */
}
```

- The panel is no longer a `<table>`. Custom CSS targeting `table.legend-table`, `tbody`, `tr` or `td.legend-table-td` should use `.maplibregl-legend-tree`, `.maplibregl-legend-row` and `.maplibregl-legend-label` instead. The other class names are unchanged.
- The panel is built with Svelte in the internal `@watergis/legend-ui` package, and bundled into the plugin.
