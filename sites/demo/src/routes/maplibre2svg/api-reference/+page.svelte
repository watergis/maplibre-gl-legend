<script lang="ts">
	import { resolve } from '$app/paths';
	import EmbeddedSite from '#lib/EmbeddedSite.svelte';
</script>

<!-- the TypeDoc site copied to static/maplibre2svg/docs/ by scripts/copy-maplibre2svg.js -->
<EmbeddedSite title="maplibre2svg API reference" src="{resolve('/')}maplibre2svg/docs/index.html" />
