# @watergis/maplibre-gl-legend

## 2.0.6

### Patch Changes

- 47e39b7: Update axios from 0.27.2 to 1.13.2
- 47e39b7: Change CI files pnpm/action-setup from v2 to v3
  And change PNPM_CACHE_FOLDER from .pnpm-store to .pnpm-store-v8
- 47e39b7: Update Node.js from v18 to v24

## 2.0.5

### Patch Changes

- aca1d0b: export types in package json

## 2.0.4

### Patch Changes

- 0dfb343: fix: only load sprite file if sprite property in style is available

## 2.0.3

### Patch Changes

- dde48e0: fix: add error handling when sprite@2x.png is not reachable

## 2.0.2

### Patch Changes

- e4634ed: fix: updated legend in styledata event

## 2.0.1

### Patch Changes

- 08a9e60: fix: add some mergin in legend-list css
- 0430288: fix: add text font color for title, only rendered checkbox and lagend label in scss

## 2.0.0

### Major Changes

- 09f6b15: This commit is going to change as follows.

  - upgraded maplibre-gl to v3 (breaking changes)
  - CDN path was changed (breaking changes)

  new CDN path

  ```html
  <link
    href="https://www.unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.css"
    rel="stylesheet"
  />
  <script src="https://www.unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.umd.js"></script>
  ```

  - introduced pnpm instead of npm/yarn
  - introduced monorepo structure by using pnpm workspace
  - migrated from webpack to vite
  - introduced eslint and prettier
