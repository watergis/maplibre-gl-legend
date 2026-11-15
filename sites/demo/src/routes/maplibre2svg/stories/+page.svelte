<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import EmbeddedSite from '#lib/EmbeddedSite.svelte';

	// the query is passed on, so that ?path=/story/... opens that story
	const src = `${resolve('/')}maplibre2svg/storybook/index.html${page.url.search}`;
</script>

<!-- the Storybook copied to static/maplibre2svg/storybook/ by scripts/copy-maplibre2svg.js -->
<EmbeddedSite title="maplibre2svg Storybook" {src} />
