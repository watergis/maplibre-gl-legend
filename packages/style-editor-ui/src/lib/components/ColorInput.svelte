<!-- Colour input: a swatch showing the colour and its opacity, opening a popup colour picker with hue and opacity sliders -->
<script lang="ts">
	import ColorPicker, { type RgbaColor } from 'svelte-awesome-color-picker';
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

	let open = $state(false);
	let root: HTMLDivElement | undefined = $state();
	let toggle: HTMLButtonElement | undefined = $state();
	let popupHeight = $state(0);
	/** where the popup is, in the viewport */
	let position: { left: number; top: number } | undefined = $state();

	/** the width of the popup; the picker sizes its sliders in px */
	const POPUP_WIDTH = 232;
	const POPUP_PADDING = 12;
	const GAP = 6;
	const MARGIN = 8;

	/**
	 * Place the popup under the swatch, or above it when there is no room below, inside the
	 * viewport. The popup is `position: fixed`, so the scrolling, `overflow: hidden` dialog does
	 * not clip it.
	 */
	const place = () => {
		if (!open || !toggle) return;
		const anchor = toggle.getBoundingClientRect();
		const below = anchor.bottom + GAP;
		const above = anchor.top - GAP - popupHeight;
		const bottom = window.innerHeight - popupHeight - MARGIN;
		// below, else above, else as low as the viewport allows
		const top =
			below <= bottom ? below : above >= MARGIN ? above : Math.max(Math.min(below, bottom), MARGIN);
		const left = Math.min(
			Math.max(anchor.left, MARGIN),
			Math.max(window.innerWidth - POPUP_WIDTH - MARGIN, MARGIN)
		);
		position = { left, top };
	};

	$effect(() => {
		if (!open) return;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		popupHeight;
		place();
		// the body of the dialog scrolls, and the dialog is dragged: follow the swatch
		const follow = () => place();
		window.addEventListener('scroll', follow, true);
		window.addEventListener('resize', follow);
		const observer = new ResizeObserver(follow);
		const dialog = toggle?.closest('.gl-style-editor-dialog');
		if (dialog) observer.observe(dialog);
		const mutations = new MutationObserver(follow);
		if (dialog) mutations.observe(dialog, { attributes: true, attributeFilter: ['style'] });
		return () => {
			window.removeEventListener('scroll', follow, true);
			window.removeEventListener('resize', follow);
			observer.disconnect();
			mutations.disconnect();
		};
	});

	const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

	/** the colour as the picker takes it */
	const rgb = $derived.by((): RgbaColor => {
		const n = parseInt(value.hex.slice(1), 16);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: value.alpha };
	});

	const opacity = $derived(Math.round(value.alpha * 100));

	const pick = (color: RgbaColor | null) => {
		if (!color) return;
		const alpha = Math.round((color.a ?? 1) * 100) / 100;
		// the picker works in HSV, so moving only the opacity slider can shift a channel by 1:
		// the colour is kept then
		const near =
			Math.abs(color.r - rgb.r) <= 1 &&
			Math.abs(color.g - rgb.g) <= 1 &&
			Math.abs(color.b - rgb.b) <= 1;
		const next: EditableColor = {
			hex:
				near && alpha !== value.alpha
					? value.hex
					: `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`,
			alpha
		};
		// the picker reports its initial colour too: only a change is written
		if (next.hex === value.hex && next.alpha === value.alpha) return;
		value = next;
		onchange?.(next);
	};

	/** close the picker on a click outside of it */
	const onpointerdown = (event: PointerEvent) => {
		if (open && root && !root.contains(event.target as Node)) open = false;
	};

	/** close the picker with Escape, back to the swatch */
	const onkeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape' || !open || !root) return;
		event.stopPropagation();
		open = false;
		toggle?.focus();
	};
</script>

<svelte:window {onpointerdown} />

<!-- Escape is caught here, before the dialog closes on it -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="gl-style-editor-color" bind:this={root} {onkeydown}>
	<button
		bind:this={toggle}
		class="gl-style-editor-color__toggle"
		type="button"
		{id}
		{name}
		aria-label={label ? `${label}: ${value.hex}, opacity ${opacity}%` : undefined}
		aria-expanded={open}
		aria-controls="{id}-picker"
		title={label}
		onclick={() => (open = !open)}
	>
		<span class="gl-style-editor-color__swatch">
			<span
				class="gl-style-editor-color__preview"
				style:background-color={value.hex}
				style:opacity={value.alpha}
			></span>
		</span>
		<span class="gl-style-editor-color__hex">{value.hex}</span>
		<span class="gl-style-editor-color__alpha">
			<span class="gl-style-editor-color__alpha-label">Opacity</span>
			{opacity}%
		</span>
	</button>
	{#if open}
		<div
			class="gl-style-editor-color__popup"
			id="{id}-picker"
			role="dialog"
			aria-label={label ? `${label} picker` : 'Colour picker'}
			bind:offsetHeight={popupHeight}
			style:left="{position?.left ?? 0}px"
			style:top="{position?.top ?? 0}px"
			style:visibility={position ? undefined : 'hidden'}
			style:width="{POPUP_WIDTH}px"
			style:padding="{POPUP_PADDING}px"
			style:--picker-width="{POPUP_WIDTH - 2 * POPUP_PADDING}px"
		>
			<ColorPicker
				{rgb}
				isDialog={false}
				sliderDirection="horizontal"
				textInputModes={['hex', 'rgb']}
				texts={{ label: { a: 'opacity' } }}
				onInput={(color) => pick(color.rgb)}
			/>
		</div>
	{/if}
</div>

<style>
	.gl-style-editor-color {
		min-width: 0;
	}

	.gl-style-editor-color__toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-width: 0;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.gl-style-editor-color__toggle:focus-visible {
		outline: none;
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

	.gl-style-editor-color__toggle:focus-visible .gl-style-editor-color__swatch,
	.gl-style-editor-color__toggle[aria-expanded='true'] .gl-style-editor-color__swatch {
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-color__preview {
		position: absolute;
		inset: 0;
	}

	.gl-style-editor-color__hex {
		flex: 1;
		min-width: 0;
		color: var(--gl-style-editor-foreground);
		font-family: var(--gl-style-editor-mono-font);
		font-size: 12px;
	}

	.gl-style-editor-color__alpha {
		flex: none;
		color: var(--gl-style-editor-foreground);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}

	.gl-style-editor-color__alpha-label {
		color: var(--gl-style-editor-muted-foreground);
	}

	.gl-style-editor-color__popup {
		position: fixed;
		z-index: 1;
		box-sizing: border-box;
		border: 1px solid var(--gl-style-editor-border);
		border-radius: var(--gl-style-editor-radius);
		background: var(--gl-style-editor-background);
		box-shadow: var(--gl-style-editor-shadow);
		--picker-height: 140px;
		--picker-radius: var(--gl-style-editor-radius-sm);
		--slider-width: 12px;
		--picker-indicator-size: 12px;
		--cp-bg-color: var(--gl-style-editor-background);
		--cp-border-color: var(--gl-style-editor-border);
		--cp-text-color: var(--gl-style-editor-foreground);
		--cp-input-color: var(--gl-style-editor-secondary);
		--cp-button-hover-color: var(--gl-style-editor-accent);
		--focus-color: var(--gl-style-editor-ring);
		--text-input-margin: 8px 0 0;
	}

	/* the picker as a block of the popup, without its own frame */
	.gl-style-editor-color__popup :global(.color-picker),
	.gl-style-editor-color__popup :global(.color-picker .wrapper) {
		display: block;
		width: 100%;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
	}
</style>
