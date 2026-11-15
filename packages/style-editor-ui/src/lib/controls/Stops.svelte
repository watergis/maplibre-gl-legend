<!-- The outputs of an expression, each with its label (e.g. `zoom 10`) and its control -->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import type { Stop } from '../utils/stops';

	interface Props {
		stops: Stop<T>[];
		/** the control of a stop */
		control: Snippet<[stop: Stop<T>, index: number]>;
	}

	let { stops, control }: Props = $props();
</script>

<ul class="gl-style-editor-stops">
	{#each stops as stop, index (index)}
		<li class="gl-style-editor-stops__stop">
			<span class="gl-style-editor-stops__label" title={stop.label}>{stop.label}</span>
			<div class="gl-style-editor-stops__control">
				{@render control(stop, index)}
			</div>
		</li>
	{/each}
</ul>

<style>
	.gl-style-editor-stops {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 0 0 0 10px;
		border-left: 2px solid var(--gl-style-editor-border);
		list-style: none;
	}

	.gl-style-editor-stops__stop {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.gl-style-editor-stops__label {
		overflow: hidden;
		color: var(--gl-style-editor-muted-foreground);
		font-size: 12px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
