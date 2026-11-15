<script lang="ts">
	/**
	 * A static site (the TypeDoc API reference of all packages, or the Storybook of maplibre2svg) shown under the
	 * header of the demo, filling the rest of the page
	 */
	interface Props {
		/** the title of the frame, for screen readers */
		title: string;
		/** the URL of the page of the site */
		src: string;
		/**
		 * reload the site, on the page it shows, when the light/dark mode of the demo changes. For a
		 * site which reads the mode when it loads, from the same origin.
		 */
		reloadOnModeChange?: boolean;
	}

	let { title, src, reloadOnModeChange = false }: Props = $props();

	let iframe: HTMLIFrameElement | undefined = $state();

	$effect(() => {
		if (!reloadOnModeChange) return;
		// LightSwitch.svelte sets data-mode on <html>
		const observer = new MutationObserver(() => iframe?.contentWindow?.location.reload());
		observer.observe(document.documentElement, { attributeFilter: ['data-mode'] });
		return () => observer.disconnect();
	});
</script>

<iframe bind:this={iframe} class="block w-full h-full border-0" {title} {src}></iframe>
