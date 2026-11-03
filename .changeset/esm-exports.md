---
'@watergis/maplibre-gl-legend': patch
---

fix: the package is now published as an ES module (`"type": "module"`), so importing it in Node.js or SSR frameworks such as SvelteKit no longer fails with `SyntaxError: Unexpected token 'export'`.

Also cleaned up `exports` in `package.json`: `types` comes first, a `default` condition was added so `require()` works on Node.js versions that support `require(esm)`, and `./package.json` is exported.
