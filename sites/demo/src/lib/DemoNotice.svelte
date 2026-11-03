<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		library: string;
	}

	let { library }: Props = $props();
</script>

<div
	class="absolute top-2 left-1/2 -translate-x-1/2 z-10 card preset-filled-surface-50-950 shadow-lg px-4 py-2 text-sm flex items-center gap-3 max-w-[calc(100%-1rem)]"
>
	<span class="truncate">{library} demo</span>
	<a class="anchor whitespace-nowrap" href={resolve('/')}>Change options</a>
</div>
