<!--
	Manual editor: the `paint` and `layout` properties of the layer as YAML or JSON, applied to the
	map with the Apply button. Properties removed from the text are reset to their defaults.
-->
<script lang="ts">
	import { Check } from '@lucide/svelte';
	import Button from '../components/Button.svelte';
	import SegmentedButton from '../components/SegmentedButton.svelte';
	import { getEditorContext } from '../context';
	import type { PropertyType } from '../interfaces';
	import {
		diffProperties,
		parseProperties,
		stringifyProperties,
		type ManualFormat,
		type Properties
	} from '../utils/manual-format';

	interface Props {
		/** the text format, kept by the dialog between layers */
		format: ManualFormat;
		/** called after the properties have been applied */
		onapply?: () => void;
	}

	let { format = $bindable(), onapply }: Props = $props();

	const context = getEditorContext();
	const { map, layer, idPrefix } = context;

	/** the current properties of the layer on the map */
	const current = (type: PropertyType): Properties | undefined => {
		const style = map.getStyle().layers.find((l) => l.id === layer.id);
		return style?.[type] as Properties | undefined;
	};

	let paint = $state(stringifyProperties(current('paint'), format));
	let layout = $state(stringifyProperties(current('layout'), format));
	let error = $state<string>();
	let applied = $state(false);

	const describe = (type: PropertyType, e: unknown) =>
		`${type}: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`;

	/** convert the text into the other format; the format is not changed when the text is invalid */
	const changeFormat = (next: ManualFormat) => {
		const previous = next === 'yaml' ? 'json' : 'yaml';
		const texts = { paint, layout };
		const converted: Partial<Record<PropertyType, string>> = {};
		for (const type of ['paint', 'layout'] as const) {
			try {
				converted[type] = stringifyProperties(parseProperties(texts[type], previous), next);
			} catch (e) {
				format = previous;
				error = describe(type, e);
				return;
			}
		}
		paint = converted.paint ?? '';
		layout = converted.layout ?? '';
		error = undefined;
	};

	const apply = () => {
		const next: Partial<Record<PropertyType, Properties>> = {};
		for (const [type, text] of [
			['paint', paint],
			['layout', layout]
		] as const) {
			try {
				next[type] = parseProperties(text, format);
			} catch (e) {
				error = describe(type, e);
				return;
			}
		}
		for (const type of ['layout', 'paint'] as const) {
			for (const [property, value] of diffProperties(current(type), next[type])) {
				context.setProperty(type, property, value);
			}
		}
		error = undefined;
		applied = true;
		setTimeout(() => (applied = false), 1500);
		onapply?.();
	};
</script>

<div class="gl-style-editor-manual">
	<div class="gl-style-editor-manual__toolbar">
		<SegmentedButton
			name="{idPrefix}-format"
			label="Format"
			choices={[
				{ value: 'yaml', label: 'YAML' },
				{ value: 'json', label: 'JSON' }
			]}
			bind:value={format}
			onchange={changeFormat}
		/>
	</div>

	<label class="gl-style-editor-manual__label" for="{idPrefix}-paint">Paint</label>
	<textarea
		class="gl-style-editor-manual__text"
		id="{idPrefix}-paint"
		spellcheck="false"
		bind:value={paint}></textarea>

	<label class="gl-style-editor-manual__label" for="{idPrefix}-layout">Layout</label>
	<textarea
		class="gl-style-editor-manual__text"
		id="{idPrefix}-layout"
		spellcheck="false"
		bind:value={layout}></textarea>

	<p class="gl-style-editor-manual__error" role="alert" hidden={!error}>{error ?? ''}</p>

	<div class="gl-style-editor-manual__actions">
		<span class="gl-style-editor-manual__status" aria-live="polite">{applied ? 'Applied' : ''}</span
		>
		<Button variant="primary" icon={Check} iconName="apply" label="Apply" onclick={apply} />
	</div>
</div>

<style>
	.gl-style-editor-manual {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gl-style-editor-manual__toolbar {
		display: flex;
		margin-bottom: 6px;
	}

	.gl-style-editor-manual__label {
		color: var(--gl-style-editor-foreground);
		font-weight: 500;
	}

	.gl-style-editor-manual__text {
		width: 100%;
		min-height: 120px;
		height: 160px;
		padding: 8px;
		border: 1px solid var(--gl-style-editor-input);
		border-radius: var(--gl-style-editor-radius-sm);
		background: var(--gl-style-editor-input-background);
		color: var(--gl-style-editor-foreground);
		font-family: var(--gl-style-editor-mono-font);
		font-size: 12px;
		line-height: 1.5;
		tab-size: 2;
		resize: vertical;
	}

	.gl-style-editor-manual__text:focus {
		border-color: var(--gl-style-editor-primary);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-style-editor-ring) 50%, transparent);
	}

	.gl-style-editor-manual__error {
		margin: 0;
		color: var(--gl-style-editor-destructive);
		font-size: 12px;
		overflow-wrap: anywhere;
	}

	.gl-style-editor-manual__actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 4px;
	}

	.gl-style-editor-manual__status {
		color: var(--gl-style-editor-muted-foreground);
		font-size: 12px;
	}
</style>
