<!-- Checkbox styled as a switch -->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		checked: boolean;
		onchange?: (checked: boolean) => void;
	}

	let { id, name, checked = $bindable(), onchange }: Props = $props();
</script>

<input
	class="gl-style-editor-switch"
	type="checkbox"
	role="switch"
	{id}
	{name}
	{checked}
	onchange={(event) => {
		checked = event.currentTarget.checked;
		onchange?.(checked);
	}}
/>

<style>
	.gl-style-editor-switch {
		position: relative;
		flex: none;
		width: 38px;
		height: 22px;
		margin: 0;
		border-radius: 11px;
		background: var(--gl-style-editor-input);
		appearance: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.gl-style-editor-switch::before {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--gl-style-editor-primary-foreground);
		box-shadow: 0 1px 2px color-mix(in oklch, var(--gl-style-editor-shadow-color) 30%, transparent);
		content: '';
		transition: transform 0.15s;
	}

	.gl-style-editor-switch:checked {
		background: var(--gl-style-editor-primary);
	}

	.gl-style-editor-switch:checked::before {
		transform: translateX(16px);
	}

	.gl-style-editor-switch:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}
</style>
