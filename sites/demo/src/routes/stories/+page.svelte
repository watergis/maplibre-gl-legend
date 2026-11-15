<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import EmbeddedSite from '#lib/EmbeddedSite.svelte';

	// the query is passed on, so that ?path=/story/... opens that story
	const src = `${resolve('/')}storybook/index.html${page.url.search}`;
</script>

<!-- the Storybook of all packages, copied to static/storybook/ by scripts/copy-storybook.js -->
<EmbeddedSite title="Storybook" {src} reloadOnModeChange />
