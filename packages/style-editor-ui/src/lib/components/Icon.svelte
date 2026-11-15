<!--
	Lucide icon (https://lucide.dev/icons/).

	The SVG is wrapped in `<span class="gl-style-editor-icon gl-style-editor-icon--{name}">` so that an icon can
	be resized with `--gl-style-editor-icon-size`, or replaced from CSS:
	  .gl-style-editor-icon--pageSize svg { display: none; }
	  .gl-style-editor-icon--pageSize { background-color: currentColor; mask: url('my-icon.svg') center / contain no-repeat; }
-->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';

	interface Props {
		/** Lucide icon component */
		icon: LucideIcon;
		/** used in the class name of the icon */
		name: string;
	}

	let { icon: IconComponent, name }: Props = $props();
</script>

<span class="gl-style-editor-icon gl-style-editor-icon--{name}" aria-hidden="true">
	<IconComponent aria-hidden="true" />
</span>

<style>
	.gl-style-editor-icon {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: var(--gl-style-editor-icon-size);
		height: var(--gl-style-editor-icon-size);
	}

	.gl-style-editor-icon :global(svg) {
		width: 100%;
		height: 100%;
	}
</style>
