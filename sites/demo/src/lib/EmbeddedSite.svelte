<script lang="ts">
	/**
	 * A static site (the TypeDoc API reference or the Storybook of maplibre2svg) shown under the
	 * header of the demo, filling the rest of the page
	 */
	interface Props {
		/** the title of the frame, for screen readers */
		title: string;
		/** the URL of the page of the site */
		src: string;
	}

	let { title, src }: Props = $props();
</script>

<iframe class="block w-full h-full border-0" {title} {src}></iframe>
