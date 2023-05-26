---
"@watergis/maplibre-gl-legend": major
---

This commit is going to change as follows.

- upgraded maplibre-gl to v3 (breaking changes)
- CDN path was changed (breaking changes)

new CDN path

```html
<link href='https://www.unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.css' rel='stylesheet' />
<script src="https://www.unpkg.com/@watergis/maplibre-gl-legend@latest/dist/maplibre-gl-legend.umd.js"></script>
```

- introduced pnpm instead of npm/yarn
- introduced monorepo structure by using pnpm workspace
- migrated from webpack to vite
- introduced eslint and prettier
