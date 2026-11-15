# @watergis/style-editor-ui

Internal Svelte UI of the layer style editor of [maplibre-gl-legend](https://github.com/watergis/maplibre-gl-legend/tree/main/packages/maplibre-gl-legend). It is bundled into `@watergis/maplibre-gl-legend` and not published on npm: enable it with the `showStyleEditor` option of the legend control.

The style editor is a non-modal dialog editing the style of a layer on the map:

- **Properties**: the main properties of the layer type (opacity, color, width, size, halo, ...) with sliders and color pickers. A property set by a zoom or data expression (`interpolate`, `step`, `match`, or a legacy function with `stops`) is edited output by output; other expressions are shown as they are and can be edited in the manual editor.
- **Manual editor**: the `paint` and `layout` properties of the layer as YAML or JSON, applied with the Apply button. Properties removed from the text are reset to their defaults.
- **Heatmap**: symbol, circle and line layers can add a heatmap layer made from their features.
- **Reset**: restores the style the layer had when the dialog was opened for it.

Each field links to the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/layers/) of its property.

## Usage

```ts
import { StyleEditorDialog } from '@watergis/style-editor-ui';

const editor = new StyleEditorDialog({ map, position: 'top-left', container: map.getContainer() });
editor.open({ layerId: 'water', title: 'Water' });
```

## Theme

The look is driven by the `--gl-style-editor-*` CSS custom properties in [`src/lib/theme.css`](src/lib/theme.css): the [Tailwind CSS colors](https://tailwindcss.com/docs/colors) as the palette, and [shadcn/ui](https://ui.shadcn.com/docs/theming) names for the roles the components use (`background`, `foreground`, `primary`, `muted`, `border`, `input`, `ring`, ...). The roles are `light-dark()` pairs which follow the `color-scheme` of the page.

```css
.gl-style-editor-dialog {
	--gl-style-editor-primary: #0f766e;
	--gl-style-editor-radius: 4px;
}
```

The styles of the components are bundled into `maplibre-gl-legend.css`.

## Development

Every component has stories, and the dialog has a story per layer type (background, fill, line, symbol with text / SDF icon / icon, circle, fill-extrusion, raster, hillshade, color-relief, heatmap) over a MapLibre map whose data is generated in the browser (`src/stories/layer-stories.ts`). The controls and the panels are shown with a mock map (`src/stories/mock-map.ts`). The stories are published with those of maplibre2svg: <https://maplibre-gl-legend.water-gis.com/stories>

```bash
pnpm --filter @watergis/style-editor-ui storybook
```

```bash
pnpm --filter @watergis/style-editor-ui test
```
