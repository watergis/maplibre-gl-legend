<!-- Dropdown list -->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		options: { label: string; value: string }[];
		value: string;
		onchange?: (value: string) => void;
	}

	let { id, name, options, value = $bindable(), onchange }: Props = $props();
</script>

<select
	class="gl-style-editor-select"
	{id}
	{name}
	{value}
	onchange={(event) => {
		value = event.currentTarget.value;
		onchange?.(value);
	}}
>
	{#each options as option (option.value)}
		<option value={option.value} selected={option.value === value}>{option.label}</option>
	{/each}
</select>

<style>
	.gl-style-editor-select {
		width: 100%;
		min-width: 0;
		height: 36px;
		padding: 0 32px 0 10px;
		border: 1px solid var(--gl-style-editor-input);
		border-radius: var(--gl-style-editor-radius-sm);
		background-color: var(--gl-style-editor-input-background);
		background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-position: right 10px center;
		background-repeat: no-repeat;
		background-size: 16px;
		color: var(--gl-style-editor-foreground);
		font: inherit;
		appearance: none;
		cursor: pointer;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.gl-style-editor-select:hover {
		border-color: var(--gl-style-editor-muted-foreground);
	}

	.gl-style-editor-select:focus {
		border-color: var(--gl-style-editor-primary);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-select:invalid {
		border-color: var(--gl-style-editor-destructive);
	}
</style>
