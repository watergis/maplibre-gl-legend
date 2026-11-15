<!-- Radio buttons styled as a segmented control -->
<script lang="ts" generics="T extends string">
	import type { LucideIcon } from '@lucide/svelte';
	import Icon from './Icon.svelte';

	interface Props {
		/** name of the radio buttons */
		name: string;
		/** accessible name of the group */
		label: string;
		/** options; the value is also used in the class name of the icon */
		choices: { value: T; label: string; icon?: LucideIcon }[];
		/** checked option */
		value: T;
		/** smaller options, for long lists */
		compact?: boolean;
		/** called with the value of the option the user checked */
		onchange?: (value: T) => void;
	}

	let { name, label, choices, value = $bindable(), compact = false, onchange }: Props = $props();
</script>

<div
	class={['gl-style-editor-segmented', compact && 'gl-style-editor-segmented--compact']}
	role="radiogroup"
	aria-label={label}
>
	{#each choices as choice (choice.value)}
		<label class="gl-style-editor-segmented__option">
			<input
				class="gl-style-editor-segmented__input"
				type="radio"
				{name}
				value={choice.value}
				checked={value === choice.value}
				onchange={(event) => {
					if (!event.currentTarget.checked) return;
					value = choice.value;
					onchange?.(choice.value);
				}}
			/>
			{#if choice.icon}
				<Icon icon={choice.icon} name={choice.value} />
			{/if}
			<span class="gl-style-editor-segmented__label">{choice.label}</span>
		</label>
	{/each}
</div>

<style>
	.gl-style-editor-segmented {
		display: flex;
		width: 100%;
		padding: 3px;
		gap: 3px;
		border: 1px solid var(--gl-style-editor-input);
		border-radius: var(--gl-style-editor-radius-sm);
		background: var(--gl-style-editor-muted);
	}

	.gl-style-editor-segmented__option {
		--gl-style-editor-icon-size: 16px;
		position: relative;
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 30px;
		border-radius: calc(var(--gl-style-editor-radius-sm) - 2px);
		color: var(--gl-style-editor-muted-foreground);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.gl-style-editor-segmented__option:hover {
		color: var(--gl-style-editor-foreground);
	}

	.gl-style-editor-segmented__option:has(.gl-style-editor-segmented__input:checked) {
		background: var(--gl-style-editor-primary);
		color: var(--gl-style-editor-primary-foreground);
		box-shadow: 0 1px 3px color-mix(in oklch, var(--gl-style-editor-shadow-color) 15%, transparent);
	}

	.gl-style-editor-segmented__option:has(.gl-style-editor-segmented__input:focus-visible) {
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-segmented__input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	/* many short options, e.g. the formats */
	.gl-style-editor-segmented--compact {
		gap: 2px;
	}

	.gl-style-editor-segmented--compact .gl-style-editor-segmented__option {
		/* longer labels, e.g. GEOTIFF, take more room */
		flex: 1 1 auto;
		min-width: 0;
		padding: 0 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.gl-style-editor-segmented--compact .gl-style-editor-segmented__label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
