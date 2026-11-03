# @watergis/maplibre-gl-legend

## 3.0.0

### Major Changes

- e084bfd: fix: upgrade maplibre-gl to ^6.4.1 to address the XSS sanitizer bypass in `DOM.sanitize()` (GHSA-jrc7-96c5-q579 / CVE-2026-85061), which affects maplibre-gl 6.4.0 and earlier.
  
  BREAKING CHANGE: `maplibre-gl` is now a peer dependency (`^6.4.1`) instead of a regular dependency, and maplibre-gl v5 is no longer supported. Install `maplibre-gl` alongside this package.
  
  BREAKING CHANGE: the UMD build (`dist/maplibre-gl-legend.umd.js`) is no longer published, and `require()` is no longer supported. maplibre-gl v6 is distributed as ES modules only, so use the ES module build (`dist/maplibre-gl-legend.es.js`). When loading from a CDN, use `<script type="module">`.

### Minor Changes

- bcfab8c: feat: add `onlyRenderedLabel` option to customize the "Only rendered" checkbox label text

### Patch Changes

- 176dd2a: fix: the close button no longer overlaps the scrollbar. Only the layer table scrolls now, so the title, the "Only rendered" checkbox and the close button stay visible. The scrollbar is shown only when needed.
  
  Note: the scroll container moved from `.maplibregl-legend-list` to the new `.maplibregl-legend-table-wrapper`. If you override `max-height` or `overflow` in your own CSS, apply it to `.maplibregl-legend-table-wrapper` instead.
- a6cb3ad: chore: upgraded devDependencies including vite and typescript to the latest
- 6b61115: fix: the package is now published as an ES module (`"type": "module"`), so importing it in Node.js or SSR frameworks such as SvelteKit no longer fails with `SyntaxError: Unexpected token 'export'`.
  
  Also cleaned up `exports` in `package.json`: `types` comes first, a `default` condition was added so `require()` works on Node.js versions that support `require(esm)`, and `./package.json` is exported.

## 2.0.7

### Patch Changes

- d4d58f5: fix: support multiple sprite sources
- e205a1a: chore: update dependencies including upgrading maplibre to v5. Removed axios from dependencies.

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
