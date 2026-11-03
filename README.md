# maplibre-gl-legend

![License](https://img.shields.io/github/license/watergis/maplibre-gl-legend)
[![version](https://img.shields.io/npm/v/@watergis/maplibre-gl-legend.svg)](https://www.npmjs.com/package/@watergis/maplibre-gl-legend)
[![CI](https://github.com/watergis/maplibre-gl-legend/actions/workflows/build.yml/badge.svg)](https://github.com/watergis/maplibre-gl-legend/actions/workflows/build.yml)
[![Release](https://github.com/watergis/maplibre-gl-legend/actions/workflows/release.yml/badge.svg)](https://github.com/watergis/maplibre-gl-legend/actions/workflows/release.yml)

This monorepo manages the source code and demo page for `@watergis/maplibre-gl-legend` and `@watergis/mapbox-gl-legend`.

## Repositories

| repository | description | changelog |
|---|---|---|
|[@watergis/maplibre-gl-legend](./packages/maplibre-gl-legend/)|The main repository to manage plugin source code|[CHANGELOG](./packages/maplibre-gl-legend/CHANGELOG.md)
|[@watergis/mapbox-gl-legend](./packages/mapbox-gl-legend/)|Mapbox GL JS version of the plugin|[CHANGELOG](./packages/mapbox-gl-legend/CHANGELOG.md)
|[demo](./sites/demo/)|The demo website built by SvelteKit|-|

## Usage of the plugin

- MapLibre GL JS: see [README](./packages/maplibre-gl-legend)
- Mapbox GL JS: see [README](./packages/mapbox-gl-legend)

## Development

```zsh
pnpm i
pnpm build
pnpm dev
```

To run the Mapbox demo, copy `sites/demo/.env.example` to `sites/demo/.env` and set `PUBLIC_MAPBOX_ACCESSTOKEN`.

## How to release

It uses changeset to release. Please create release notes by the following command. Changeset will release package once the PR is merged into main branch.

```zsh
pnpm changeset
```

## Contribution

See [CONTRIBUTING](./.github/CONTRIBUTING.md)
