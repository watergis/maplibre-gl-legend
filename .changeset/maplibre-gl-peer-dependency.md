---
'@watergis/maplibre-gl-legend': major
---

fix: upgrade maplibre-gl to ^6.4.1 to address the XSS sanitizer bypass in `DOM.sanitize()` (GHSA-jrc7-96c5-q579 / CVE-2026-85061), which affects maplibre-gl 6.4.0 and earlier.

BREAKING CHANGE: `maplibre-gl` is now a peer dependency (`^6.4.1`) instead of a regular dependency, and maplibre-gl v5 is no longer supported. Install `maplibre-gl` alongside this package.
