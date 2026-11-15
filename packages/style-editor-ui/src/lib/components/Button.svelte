<!-- Text button, with an optional leading icon -->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import Icon from './Icon.svelte';

	interface Props {
		variant: 'primary' | 'secondary';
		icon?: LucideIcon;
		/** used in the class name of the icon */
		iconName?: string;
		label: string;
		title?: string;
		disabled?: boolean;
		onclick: () => void;
	}

	let { variant, icon, iconName = '', label, title, disabled = false, onclick }: Props = $props();
</script>

<button
	type="button"
	class={['gl-style-editor-btn', `gl-style-editor-btn--${variant}`]}
	{title}
	{disabled}
	{onclick}
>
	{#if icon}
		<Icon {icon} name={iconName} />
	{/if}
	<span class="gl-style-editor-btn__label">{label}</span>
</button>

<style>
	.gl-style-editor-btn {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 32px;
		padding: 0 12px;
		border: 1px solid transparent;
		border-radius: var(--gl-style-editor-radius-sm);
		font: inherit;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			opacity 0.15s;
	}

	.gl-style-editor-btn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.gl-style-editor-btn--primary {
		background: var(--gl-style-editor-primary);
		color: var(--gl-style-editor-primary-foreground);
	}

	.gl-style-editor-btn--primary:hover:not(:disabled) {
		background: color-mix(in oklch, var(--gl-style-editor-primary) 90%, transparent);
	}

	.gl-style-editor-btn--secondary {
		border-color: var(--gl-style-editor-input);
		background: var(--gl-style-editor-secondary);
		color: var(--gl-style-editor-secondary-foreground);
	}

	.gl-style-editor-btn--secondary:hover:not(:disabled) {
		background: color-mix(in oklch, var(--gl-style-editor-secondary) 80%, transparent);
	}
</style>
