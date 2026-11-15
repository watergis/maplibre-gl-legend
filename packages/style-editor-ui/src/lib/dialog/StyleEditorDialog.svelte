<!--
	Non-modal dialog editing the style of a layer: the fields of its layer type (see `LayerPanel`),
	or its `paint` and `layout` properties as text (see `ManualEditor`). The changes are applied to
	the map at once, and the map stays usable while the dialog is open.

	The dialog can be moved by dragging its header. It is closed with its close button or Escape.

	Every element has a `gl-style-editor-` class, and the theme is driven by the
	`--gl-style-editor-*` custom properties of `theme.css`.
-->
<script lang="ts">
	import { Code, Palette, RotateCcw, SlidersHorizontal, X } from '@lucide/svelte';
	import type { LayerSpecification } from 'maplibre-gl';
	import { onMount } from 'svelte';
	import '../theme.css';
	import HelpLink from '../components/HelpLink.svelte';
	import Icon from '../components/Icon.svelte';
	import IconButton from '../components/IconButton.svelte';
	import { setEditorContext, type EditorContext } from '../context';
	import type { PropertyType, StyleEditorDialogOptions, StyleEditorTarget } from '../interfaces';
	import LayerPanel from '../panels/LayerPanel.svelte';
	import ManualEditor from '../panels/ManualEditor.svelte';
	import { diffProperties, type ManualFormat, type Properties } from '../utils/manual-format';

	interface Props {
		options: StyleEditorDialogOptions;
		/** the layer to edit first */
		target: StyleEditorTarget;
		/** prefix of the ids of the form elements, unique to the dialog */
		idPrefix: string;
		/** called once the dialog has been closed */
		onclosed: () => void;
	}

	let { options, target: initialTarget, idPrefix, onclosed }: Props = $props();

	const map = $derived(options.map);

	// svelte-ignore state_referenced_locally
	let target = $state(initialTarget);
	/** the layer being edited, as it was when the dialog was opened for it */
	let layer = $state.raw<LayerSpecification>();
	/** bumped to rebuild the fields after the style changed outside of them (reset, manual editor) */
	let version = $state(0);
	let manual = $state(false);
	let format = $state<ManualFormat>('yaml');

	let dialog: HTMLDialogElement;

	const findLayer = (layerId: string) =>
		map.getStyle().layers.find((l) => l.id === layerId) as LayerSpecification | undefined;

	const load = (next: StyleEditorTarget) => {
		const found = findLayer(next.layerId);
		if (!found) return false;
		target = next;
		layer = structuredClone(found);
		version++;
		return true;
	};

	/**
	 * Edit another layer. The dialog keeps its position and its mode (fields or manual editor).
	 *
	 * @param next the layer
	 * @returns false when the layer is not in the style
	 */
	export function setTarget(next: StyleEditorTarget): boolean {
		return load(next);
	}

	/** Close the dialog */
	export function close() {
		dialog?.close();
	}

	/**
	 * Whether a node is in the dialog
	 *
	 * @param node the node
	 */
	export function contains(node: Node | null): boolean {
		return !!node && !!dialog?.contains(node);
	}

	type PaintProperty = Parameters<typeof map.setPaintProperty>[1];
	type LayoutProperty = Parameters<typeof map.setLayoutProperty>[1];

	const setProperty = (type: PropertyType, property: string, value: unknown) => {
		if (!layer || !map.getLayer(layer.id)) return;
		try {
			if (type === 'paint')
				map.setPaintProperty(layer.id, property as PaintProperty, value as never);
			else map.setLayoutProperty(layer.id, property as LayoutProperty, value as never);
		} catch (e) {
			console.error(e);
			return;
		}
		options.onChange?.(layer.id);
	};

	const getProperty = (type: PropertyType, property: string) => {
		if (!layer || !map.getLayer(layer.id)) return undefined;
		return type === 'paint'
			? map.getPaintProperty(layer.id, property as PaintProperty)
			: map.getLayoutProperty(layer.id, property as LayoutProperty);
	};

	// the context read by the fields; `layer` is read when a panel is created
	const context: EditorContext = {
		get map() {
			return map;
		},
		get layer() {
			return layer as LayerSpecification;
		},
		get idPrefix() {
			return idPrefix;
		},
		setProperty,
		getProperty,
		openManualEditor: () => (manual = true)
	};
	setEditorContext(context);

	/** restore the properties the layer had when the dialog was opened for it */
	const reset = () => {
		if (!layer) return;
		const current = findLayer(layer.id);
		for (const type of ['layout', 'paint'] as const) {
			for (const [property, value] of diffProperties(
				current?.[type] as Properties | undefined,
				layer[type] as Properties | undefined
			)) {
				setProperty(type, property, value);
			}
		}
		version++;
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			close();
		}
	};

	/**
	 * The area the dialog is kept in: the container given in the options (usually the map), or the
	 * window.
	 */
	const getArea = () =>
		options.container?.getBoundingClientRect() ??
		new DOMRect(0, 0, window.innerWidth, window.innerHeight);

	/** the space between the dialog and the edges of the area when it opens */
	const getMargin = () => {
		const offset = parseFloat(
			getComputedStyle(dialog).getPropertyValue('--gl-style-editor-offset')
		);
		return Number.isFinite(offset) ? offset : 16;
	};

	/** on small screens, the dialog is along the bottom of the screen (see the styles) */
	const isMobile = () => window.matchMedia('(max-width: 480px)').matches;

	let area = $state<DOMRect>();
	/** the position of the dialog in the area, set when it opens and when it is dragged */
	let offset = $state<{ x: number; y: number }>();
	/** with a container, the dialog is not higher than it, and its body scrolls */
	let maxHeight = $state<number>();

	/** keep a position in the area, as far as the size of the dialog allows */
	const clamp = (position: { x: number; y: number }, bounds: DOMRect) => ({
		x: Math.min(Math.max(position.x, 0), Math.max(bounds.width - dialog.offsetWidth, 0)),
		y: Math.min(Math.max(position.y, 0), Math.max(bounds.height - dialog.offsetHeight, 0))
	});

	/** follow the area when it moves or is resized: the page scrolled, the window was resized, ... */
	const update = () => {
		if (!dialog || isMobile()) return;
		const bounds = getArea();
		area = bounds;
		if (options.container) maxHeight = Math.max(bounds.height - 2 * getMargin(), 120);
		if (offset) offset = clamp(offset, bounds);
	};

	/** place the dialog in the corner of the area set by `position` */
	const place = () => {
		if (isMobile()) return;
		const bounds = getArea();
		area = bounds;
		const margin = getMargin();
		if (options.container) maxHeight = Math.max(bounds.height - 2 * margin, 120);
		const position = options.position ?? 'top-left';
		// the size of the dialog with its maximum height
		const width = dialog.offsetWidth;
		const height = Math.min(dialog.offsetHeight, maxHeight ?? Infinity);
		offset = clamp(
			{
				x: position.endsWith('left') ? margin : bounds.width - margin - width,
				y: position.startsWith('top') ? margin : bounds.height - margin - height
			},
			bounds
		);
	};

	/** move the dialog by dragging its header, but not its buttons. It stays in the area */
	const onHeaderPointerDown = (event: PointerEvent) => {
		if (event.button !== 0 || (event.target as Element).closest('button, a')) return;
		if (isMobile()) return;
		const bounds = getArea();
		const rect = dialog.getBoundingClientRect();
		const start = { x: rect.left - bounds.left, y: rect.top - bounds.top };
		const pointer = { x: event.clientX, y: event.clientY };
		const header = event.currentTarget as HTMLElement;
		header.setPointerCapture(event.pointerId);
		const move = (e: PointerEvent) => {
			const current = getArea();
			area = current;
			offset = clamp(
				{ x: start.x + e.clientX - pointer.x, y: start.y + e.clientY - pointer.y },
				current
			);
		};
		const up = () => {
			header.removeEventListener('pointermove', move);
			header.removeEventListener('pointerup', up);
			header.removeEventListener('pointercancel', up);
		};
		header.addEventListener('pointermove', move);
		header.addEventListener('pointerup', up);
		header.addEventListener('pointercancel', up);
		event.preventDefault();
	};

	onMount(() => {
		load(initialTarget);
		dialog.show();
		place();
		// the area moves with the page, and the dialog changes size with its content
		const observer = new ResizeObserver(update);
		observer.observe(dialog);
		if (options.container) observer.observe(options.container);
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
		};
	});
</script>

<dialog
	bind:this={dialog}
	class={[
		'gl-style-editor-dialog',
		`gl-style-editor-dialog--${options.position ?? 'top-left'}`,
		offset && 'gl-style-editor-dialog--placed'
	]}
	style:left={offset && area ? `${area.left + offset.x}px` : undefined}
	style:top={offset && area ? `${area.top + offset.y}px` : undefined}
	style:max-height={maxHeight ? `${maxHeight}px` : undefined}
	aria-labelledby="{idPrefix}-title"
	onkeydown={onKeyDown}
	onclose={onclosed}
>
	<!-- svelte-ignore a11y_no_static_element_interactions (dragging the header is optional) -->
	<header class="gl-style-editor-dialog__header" onpointerdown={onHeaderPointerDown}>
		<Icon icon={Palette} name="title" />
		<div class="gl-style-editor-dialog__heading">
			<h2 class="gl-style-editor-dialog__title" id="{idPrefix}-title">
				{target.title ?? target.layerId}
			</h2>
			{#if layer}
				<p class="gl-style-editor-dialog__subtitle">
					<span class="gl-style-editor-dialog__type">{layer.type}</span>
					<span class="gl-style-editor-dialog__id" title={layer.id}>{layer.id}</span>
					<HelpLink layerType={layer.type} />
				</p>
			{/if}
		</div>
		<IconButton icon={X} name="close" label="Close" onclick={close} />
	</header>

	<div class="gl-style-editor-dialog__tabs" role="toolbar" aria-label="Editor mode">
		<IconButton
			icon={SlidersHorizontal}
			name="fields"
			label="Properties"
			pressed={!manual}
			onclick={() => {
				manual = false;
				version++;
			}}
		/>
		<IconButton
			icon={Code}
			name="manualEditor"
			label="Manual editor"
			pressed={manual}
			onclick={() => (manual = true)}
		/>
		<span class="gl-style-editor-dialog__spacer"></span>
		<IconButton icon={RotateCcw} name="reset" label="Reset changes" onclick={reset} />
	</div>

	<div class="gl-style-editor-dialog__body">
		{#if layer}
			{#key `${layer.id}:${version}:${manual}`}
				{#if manual}
					<ManualEditor bind:format />
				{:else}
					<LayerPanel />
				{/if}
			{/key}
		{:else}
			<p class="gl-style-editor-dialog__missing">The layer {target.layerId} is not in the style.</p>
		{/if}
	</div>
</dialog>

<style>
	.gl-style-editor-dialog {
		position: fixed;
		z-index: var(--gl-style-editor-z-index);
		display: flex;
		flex-direction: column;
		width: min(var(--gl-style-editor-width), calc(100vw - 2 * var(--gl-style-editor-offset)));
		max-width: none;
		max-height: var(--gl-style-editor-max-height);
		margin: 0;
		padding: 0;
		overflow: hidden;
		border: 1px solid var(--gl-style-editor-border);
		border-radius: var(--gl-style-editor-radius);
		background: var(--gl-style-editor-background);
		color: var(--gl-style-editor-foreground);
		box-shadow: var(--gl-style-editor-shadow);
		font-family: var(--gl-style-editor-font);
		font-size: var(--gl-style-editor-font-size);
		line-height: 1.4;
	}

	.gl-style-editor-dialog:not([open]) {
		display: none;
	}

	.gl-style-editor-dialog[open] {
		animation: gl-style-editor-in 0.15s ease-out;
	}

	@keyframes gl-style-editor-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.gl-style-editor-dialog--top-left {
		inset: var(--gl-style-editor-offset) auto auto var(--gl-style-editor-offset);
	}

	.gl-style-editor-dialog--top-right {
		inset: var(--gl-style-editor-offset) var(--gl-style-editor-offset) auto auto;
	}

	.gl-style-editor-dialog--bottom-left {
		inset: auto auto var(--gl-style-editor-offset) var(--gl-style-editor-offset);
	}

	.gl-style-editor-dialog--bottom-right {
		inset: auto var(--gl-style-editor-offset) var(--gl-style-editor-offset) auto;
	}

	/* placed in the area (the map, or the window) by `left` and `top` */
	.gl-style-editor-dialog--placed {
		right: auto;
		bottom: auto;
	}

	/* header */

	.gl-style-editor-dialog__header {
		--gl-style-editor-icon-size: 18px;
		display: flex;
		flex: none;
		align-items: flex-start;
		gap: 10px;
		padding: 12px 10px 10px 14px;
		border-bottom: 1px solid var(--gl-style-editor-border);
		cursor: move;
		touch-action: none;
		user-select: none;
	}

	.gl-style-editor-dialog__header > :global(.gl-style-editor-icon--title) {
		margin-top: 2px;
		color: var(--gl-style-editor-primary);
	}

	.gl-style-editor-dialog__heading {
		flex: 1;
		min-width: 0;
	}

	.gl-style-editor-dialog__title {
		margin: 0;
		overflow: hidden;
		font-size: 15px;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.gl-style-editor-dialog__subtitle {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		margin: 2px 0 0;
		color: var(--gl-style-editor-muted-foreground);
		font-size: 12px;
	}

	.gl-style-editor-dialog__type {
		flex: none;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--gl-style-editor-secondary);
		color: var(--gl-style-editor-secondary-foreground);
		font-weight: 500;
	}

	.gl-style-editor-dialog__id {
		overflow: hidden;
		font-family: var(--gl-style-editor-mono-font);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* toolbar: the editor mode, and the reset button */

	.gl-style-editor-dialog__tabs {
		display: flex;
		flex: none;
		align-items: center;
		gap: 2px;
		padding: 6px 10px;
		border-bottom: 1px solid var(--gl-style-editor-border);
		background: var(--gl-style-editor-muted);
	}

	.gl-style-editor-dialog__spacer {
		flex: 1;
	}

	/* body */

	.gl-style-editor-dialog__body {
		flex: 1;
		min-height: 0;
		padding: 14px;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.gl-style-editor-dialog__missing {
		margin: 0;
		color: var(--gl-style-editor-muted-foreground);
	}

	/* mobile: along the bottom of the screen */
	@media (max-width: 480px) {
		.gl-style-editor-dialog,
		.gl-style-editor-dialog--placed {
			inset: auto 0 0 0 !important;
			width: 100vw;
			max-height: 60dvh !important;
			border-radius: var(--gl-style-editor-radius) var(--gl-style-editor-radius) 0 0;
		}

		.gl-style-editor-dialog__header {
			cursor: default;
		}
	}
</style>
