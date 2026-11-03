---
'@watergis/maplibre-gl-legend': major
---

fix: upgrade maplibre-gl to ^6.4.1 to address the XSS sanitizer bypass in `DOM.sanitize()` (GHSA-jrc7-96c5-q579 / CVE-2026-85061), which affects maplibre-gl 6.4.0 and earlier.

BREAKING CHANGE: `maplibre-gl` is now a peer dependency (`^6.4.1`) instead of a regular dependency, and maplibre-gl v5 is no longer supported. Install `maplibre-gl` alongside this package.

BREAKING CHANGE: the UMD build (`dist/maplibre-gl-legend.umd.js`) is no longer published, and `require()` is no longer supported. maplibre-gl v6 is distributed as ES modules only, so use the ES module build (`dist/maplibre-gl-legend.es.js`). When loading from a CDN, use `<script type="module">`.
