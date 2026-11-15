<!-- Colour input: a swatch opening the colour picker, the hex code, and the opacity of the colour -->
<script lang="ts">
	import type { EditableColor } from '../utils/color';

	interface Props {
		id: string;
		name: string;
		/** accessible name, when the input has no `<label>` */
		label?: string;
		value: EditableColor;
		/** the colour changed, while it is being picked */
		onchange?: (value: EditableColor) => void;
	}

	let { id, name, label, value = $bindable(), onchange }: Props = $props();

	const set = (next: EditableColor) => {
		value = next;
		onchange?.(next);
	};
</script>

<div class="gl-style-editor-color">
	<span class="gl-style-editor-color__swatch">
		<span
			class="gl-style-editor-color__preview"
			style:background-color={value.hex}
			style:opacity={value.alpha}
		></span>
		<input
			class="gl-style-editor-color__picker"
			type="color"
			{id}
			{name}
			aria-label={label}
			title={label}
			value={value.hex}
			oninput={(event) => set({ ...value, hex: event.currentTarget.value })}
		/>
	</span>
	<span class="gl-style-editor-color__hex">{value.hex}</span>
	<label class="gl-style-editor-color__alpha" title="Opacity of the colour">
		<input
			class="gl-style-editor-color__alpha-input"
			type="number"
			min="0"
			max="100"
			step="1"
			aria-label={label ? `${label} opacity` : 'Opacity'}
			value={Math.round(value.alpha * 100)}
			oninput={(event) => {
				const n = Number(event.currentTarget.value);
				if (event.currentTarget.value === '' || !Number.isFinite(n)) return;
				set({ ...value, alpha: Math.min(Math.max(n, 0), 100) / 100 });
			}}
		/>
		<span class="gl-style-editor-color__unit">%</span>
	</label>
</div>

<style>
	.gl-style-editor-color {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.gl-style-editor-color__swatch {
		position: relative;
		flex: none;
		width: 30px;
		height: 30px;
		overflow: hidden;
		border: 1px solid var(--gl-style-editor-input);
		border-radius: var(--gl-style-editor-radius-sm);
		/* a checkerboard behind translucent colours */
		background: repeating-conic-gradient(
				var(--gl-style-editor-border) 0% 25%,
				var(--gl-style-editor-input-background) 0% 50%
			)
			50% / 10px 10px;
	}

	.gl-style-editor-color__swatch:focus-within {
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-color__preview {
		position: absolute;
		inset: 0;
	}

	/* the native input covers the swatch, invisible, to open the picker */
	.gl-style-editor-color__picker {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		border: none;
		opacity: 0;
		cursor: pointer;
	}

	.gl-style-editor-color__hex {
		flex: 1;
		min-width: 0;
		color: var(--gl-style-editor-foreground);
		font-family: var(--gl-style-editor-mono-font);
		font-size: 12px;
	}

	.gl-style-editor-color__alpha {
		display: flex;
		flex: none;
		align-items: center;
		width: 72px;
		height: 30px;
		padding: 0 8px;
		gap: 4px;
		border: 1px solid var(--gl-style-editor-input);
		border-radius: var(--gl-style-editor-radius-sm);
		background: var(--gl-style-editor-input-background);
	}

	.gl-style-editor-color__alpha:focus-within {
		border-color: var(--gl-style-editor-primary);
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-color__alpha-input {
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

	.gl-style-editor-color__alpha-input:focus {
		outline: none;
	}

	.gl-style-editor-color__unit {
		color: var(--gl-style-editor-muted-foreground);
		font-size: 12px;
	}
</style>
