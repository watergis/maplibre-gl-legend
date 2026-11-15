<!-- Slider with a number box: the box accepts values out of the range of the slider -->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		/** accessible name, when the input has no `<label>` */
		label?: string;
		value: number;
		min: number;
		max: number;
		step: number;
		/** shown after the number box, e.g. `px` */
		unit?: string;
		/** the value changed */
		onchange?: (value: number) => void;
	}

	let { id, name, label, value = $bindable(), min, max, step, unit, onchange }: Props = $props();

	const progress = $derived(
		Math.min(Math.max(((value - min) / Math.max(max - min, Number.EPSILON)) * 100, 0), 100)
	);

	const set = (input: string) => {
		const n = Number(input);
		if (input.trim() === '' || !Number.isFinite(n)) return;
		value = n;
		onchange?.(n);
	};
</script>

<div class="gl-style-editor-number">
	<input
		class="gl-style-editor-number__range"
		type="range"
		{name}
		{min}
		{max}
		{step}
		value={Math.min(Math.max(value, min), max)}
		aria-label={label}
		tabindex="-1"
		style:--gl-style-editor-range-progress="{progress}%"
		oninput={(event) => set(event.currentTarget.value)}
	/>
	<div class="gl-style-editor-number__box">
		<input
			class="gl-style-editor-number__input"
			type="number"
			{id}
			{name}
			{step}
			{value}
			aria-label={label}
			oninput={(event) => set(event.currentTarget.value)}
		/>
		{#if unit}
			<span class="gl-style-editor-number__unit">{unit}</span>
		{/if}
	</div>
</div>

<style>
	.gl-style-editor-number {
		--gl-style-editor-range-thumb: 16px;
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
	}

	.gl-style-editor-number__range {
		--gl-style-editor-range-track: linear-gradient(
			to right,
			var(--gl-style-editor-primary) var(--gl-style-editor-range-progress, 0%),
			var(--gl-style-editor-border) var(--gl-style-editor-range-progress, 0%)
		);
		flex: 1;
		min-width: 0;
		height: 20px;
		margin: 0;
		background: transparent;
		appearance: none;
		cursor: pointer;
	}

	.gl-style-editor-number__range::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 2px;
		background: var(--gl-style-editor-range-track);
	}

	.gl-style-editor-number__range::-moz-range-track {
		height: 4px;
		border-radius: 2px;
		background: var(--gl-style-editor-range-track);
	}

	.gl-style-editor-number__range::-webkit-slider-thumb {
		width: var(--gl-style-editor-range-thumb);
		height: var(--gl-style-editor-range-thumb);
		margin-top: calc((4px - var(--gl-style-editor-range-thumb)) / 2);
		border: 2px solid var(--gl-style-editor-primary-foreground);
		border-radius: 50%;
		background: var(--gl-style-editor-primary);
		box-shadow: 0 1px 3px color-mix(in oklch, var(--gl-style-editor-shadow-color) 35%, transparent);
		appearance: none;
	}

	.gl-style-editor-number__range::-moz-range-thumb {
		box-sizing: border-box;
		width: var(--gl-style-editor-range-thumb);
		height: var(--gl-style-editor-range-thumb);
		border: 2px solid var(--gl-style-editor-primary-foreground);
		border-radius: 50%;
		background: var(--gl-style-editor-primary);
		box-shadow: 0 1px 3px color-mix(in oklch, var(--gl-style-editor-shadow-color) 35%, transparent);
	}

	.gl-style-editor-number__range:focus {
		outline: none;
	}

	.gl-style-editor-number__box {
		display: flex;
		flex: none;
		align-items: center;
		width: 92px;
		height: 30px;
		padding: 0 8px;
		gap: 4px;
		border: 1px solid var(--gl-style-editor-input);
		border-radius: var(--gl-style-editor-radius-sm);
		background: var(--gl-style-editor-input-background);
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.gl-style-editor-number__box:focus-within {
		border-color: var(--gl-style-editor-primary);
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-number__input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--gl-style-editor-foreground);
		font: inherit;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.gl-style-editor-number__input:focus {
		outline: none;
	}

	.gl-style-editor-number__unit {
		flex: none;
		color: var(--gl-style-editor-muted-foreground);
		font-size: 12px;
	}
</style>
