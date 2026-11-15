# Storybook

The Storybook of all packages, shown on the demo site at `/stories`: an introduction, and the Storybooks of [maplibre2svg](../../packages/maplibre2svg) and [style-editor-ui](../../packages/style-editor-ui) composed into it with [Storybook Composition](https://storybook.js.org/docs/sharing/storybook-composition). Each package keeps its own Storybook (and framework), and is shown as a group of the sidebar.

## Development

Start the Storybook of each package, then this one, which refers to them at `http://localhost:6006` (maplibre2svg) and `http://localhost:6008` (style-editor-ui):

```bash
pnpm --filter @watergis/maplibre2svg storybook
```

```bash
pnpm --filter @watergis/style-editor-ui storybook
```

```bash
pnpm --filter @watergis/storybook storybook
```

## Build

```bash
pnpm --filter @watergis/storybook build-storybook
```

builds the Storybooks of the packages and this one, and copies the packages into `build/maplibre2svg` and `build/style-editor-ui`, where `build/index.html` refers to them. The demo site copies `build/` into `static/storybook/` when it is built (`sites/demo/scripts/copy-storybook.js`).
