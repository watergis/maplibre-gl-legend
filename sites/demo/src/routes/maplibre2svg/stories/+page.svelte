<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	/**
	 * The Storybook of maplibre2svg is now part of the Storybook of all packages, at /stories. The
	 * ids of its stories are prefixed with its name there: `?path=/story/layers-fill--...` becomes
	 * `?path=/story/maplibre2svg_layers-fill--...`.
	 */
	onMount(() => {
		const path = page.url.searchParams.get('path');
		const match = path?.match(/^\/(story|docs)\/(.+)$/);
		const query = match ? `?path=/${match[1]}/maplibre2svg_${match[2]}` : '';
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/stories')}${query}`, { replace: true });
	});
</script>

<p class="p-4">
	The Storybook of maplibre2svg has moved to <a class="anchor" href={resolve('/stories')}>Stories</a
	>.
</p>
