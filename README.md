# malibre-gl-legend

This monorepo manages the source code and demo page for `@watergis/maplibre-gl-legend`.

## Repositories

| repository | description | changelog |
|---|---|---|
|[@watergis/maplibre-gl-legend](./packages/maplibre-gl-export/)|The main repository to manage plugin source code|[CHANGELOG](./packages/maplibre-gl-legend/CHANGELOG.md)
|[maplibre-gl-legend.water-gis.com](./sites/maplibre-gl-legend.water-gis.com/)|The repository manages demo website|-|

## Usage of the plugin

See [README](./packages/maplibre-gl-legend)

## How to release

It uses changeset to release. Please create release notes by the following command. Changeset will release package once the PR is merged into main branch.

```zsh
pnpm changeset
```

## Contribution

See [CONTRIBUTING](./.github/CONTRIBUTING.md)
