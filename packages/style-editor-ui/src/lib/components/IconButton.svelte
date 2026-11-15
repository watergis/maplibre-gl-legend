<!-- Round button showing only an icon, e.g. the close button of the dialog -->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import Icon from './Icon.svelte';

	interface Props {
		icon: LucideIcon;
		/** used in the class name of the icon */
		name: string;
		/** accessible name and tooltip */
		label: string;
		/** whether the button is shown as pressed, for a toggle */
		pressed?: boolean;
		onclick: () => void;
	}

	let { icon, name, label, pressed, onclick }: Props = $props();
</script>

<button
	type="button"
	class={['gl-style-editor-icon-btn', pressed && 'gl-style-editor-icon-btn--pressed']}
	aria-label={label}
	aria-pressed={pressed}
	title={label}
	{onclick}
>
	<Icon {icon} {name} />
</button>

<style>
	.gl-style-editor-icon-btn {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		padding: 0;
		border: none;
		border-radius: var(--gl-style-editor-radius-sm);
		background: transparent;
		color: var(--gl-style-editor-muted-foreground);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.gl-style-editor-icon-btn:hover {
		background: var(--gl-style-editor-accent);
		color: var(--gl-style-editor-accent-foreground);
	}

	.gl-style-editor-icon-btn--pressed {
		background: color-mix(in oklch, var(--gl-style-editor-primary) 14%, transparent);
		color: var(--gl-style-editor-primary);
	}

	.gl-style-editor-icon-btn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}
</style>
