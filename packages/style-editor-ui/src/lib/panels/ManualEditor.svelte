<!--
	Manual editor: the `paint` and `layout` properties of the layer as YAML or JSON, applied to the
	map with the Apply button once they are valid against the style specification. Properties
	removed from the text are reset to their defaults. The
	layout properties are shown only for the layer types whose fields edit one (see
	`hasLayoutFields()`). "Show full layer spec" shows the whole layer instead, read-only.
-->
<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';
	import Button from '../components/Button.svelte';
	import IconButton from '../components/IconButton.svelte';
	import SegmentedButton from '../components/SegmentedButton.svelte';
	import Switch from '../components/Switch.svelte';
	import { getEditorContext } from '../context';
	import type { PropertyType } from '../interfaces';
	import {
		diffProperties,
		parseProperties,
		stringifyLayer,
		stringifyProperties,
		type ManualFormat,
		type Properties
	} from '../utils/manual-format';
	import { validateLayerProperties } from '../utils/spec';
	import { hasLayoutFields } from './fields';

	interface Props {
		/** the text format, kept by the dialog between layers */
		format: ManualFormat;
		/** show the whole layer, read-only, instead of the editable properties; kept by the dialog */
		full?: boolean;
		/** called after the properties have been applied */
		onapply?: () => void;
	}

	let { format = $bindable(), full = $bindable(false), onapply }: Props = $props();

	const context = getEditorContext();
	const { map, layer, idPrefix } = context;

	/** whether the layout properties are shown and applied */
	const showLayout = hasLayoutFields(layer.type);
	const types: PropertyType[] = showLayout ? ['paint', 'layout'] : ['paint'];

	/** the layer as it is on the map */
	const currentLayer = () => map.getStyle().layers.find((l) => l.id === layer.id);

	/** the current properties of the layer on the map */
	const current = (type: PropertyType): Properties | undefined =>
		currentLayer()?.[type] as Properties | undefined;

	let texts = $state<Record<PropertyType, string>>({
		paint: stringifyProperties(current('paint'), format),
		layout: stringifyProperties(current('layout'), format)
	});
	let fullText = $state(stringifyLayer(currentLayer(), format));
	let error = $state<string>();
	let applied = $state(false);

	/** the properties on the map, refreshed after Apply; the text is compared with them */
	const readBaseline = () => ({ paint: current('paint'), layout: current('layout') });
	let baseline = $state.raw<Record<PropertyType, Properties | undefined>>(readBaseline());

	/** whether the text differs from the properties on the map; invalid text counts as a change */
	const changed = $derived(
		types.some((type) => {
			try {
				return diffProperties(baseline[type], parseProperties(texts[type], format)).length > 0;
			} catch {
				return true;
			}
		})
	);
	let copied = $state<string>();

	const describe = (type: PropertyType, e: unknown) =>
		`${type}: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`;

	/** convert the text into the other format; the format is not changed when the text is invalid */
	const changeFormat = (next: ManualFormat) => {
		const previous = next === 'yaml' ? 'json' : 'yaml';
		const converted: Partial<Record<PropertyType, string>> = {};
		for (const type of types) {
			try {
				converted[type] = stringifyProperties(parseProperties(texts[type], previous), next);
			} catch (e) {
				format = previous;
				error = describe(type, e);
				return;
			}
		}
		for (const type of types) texts[type] = converted[type] ?? '';
		fullText = stringifyLayer(currentLayer(), next);
		error = undefined;
	};

	const changeFull = (checked: boolean) => {
		if (checked) fullText = stringifyLayer(currentLayer(), format);
		error = undefined;
	};

	const apply = () => {
		const next: Partial<Record<PropertyType, Properties>> = {};
		for (const type of types) {
			try {
				next[type] = parseProperties(texts[type], format);
			} catch (e) {
				error = describe(type, e);
				return;
			}
		}
		// check the properties against the style specification before changing the map
		const style = map.getStyle();
		const target = style.layers.find((l) => l.id === layer.id);
		if (target) {
			const errors = validateLayerProperties(style, {
				...target,
				...next
			} as typeof target).filter((message) => types.some((type) => message.startsWith(`${type}.`)));
			if (errors.length > 0) {
				error = errors.join('\n');
				return;
			}
		}
		for (const type of ['layout', 'paint'] as const) {
			if (!types.includes(type)) continue;
			for (const [property, value] of diffProperties(current(type), next[type])) {
				context.setProperty(type, property, value);
			}
		}
		baseline = readBaseline();
		error = undefined;
		applied = true;
		setTimeout(() => (applied = false), 1500);
		onapply?.();
	};

	/**
	 * copy the text of a text area to the clipboard. Where the Clipboard API is not allowed (e.g. in
	 * an iframe without the `clipboard-write` permission), the text area is selected and copied.
	 */
	const copy = async (key: string, text: string) => {
		try {
			try {
				await navigator.clipboard.writeText(text);
			} catch (e) {
				const textarea = document.getElementById(`${idPrefix}-${key}`);
				if (!(textarea instanceof HTMLTextAreaElement)) throw e;
				textarea.select();
				if (!document.execCommand('copy')) throw e;
			}
			error = undefined;
			copied = key;
			setTimeout(() => {
				if (copied === key) copied = undefined;
			}, 1500);
		} catch (e) {
			error = `copy: ${e instanceof Error ? e.message : String(e)}`;
		}
	};

	const LABELS: Record<PropertyType, string> = { paint: 'Paint', layout: 'Layout' };
</script>

{#snippet labelRow(key: string, label: string, text: string)}
	<div class="gl-style-editor-manual__label-row">
		<label class="gl-style-editor-manual__label" for="{idPrefix}-{key}">{label}</label>
		<IconButton
			icon={copied === key ? Check : Copy}
			name="copy-{key}"
			label="Copy {label}"
			onclick={() => copy(key, text)}
		/>
	</div>
{/snippet}

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

	<div class="gl-style-editor-manual__full">
		<Switch id="{idPrefix}-full" name="full" bind:checked={full} onchange={changeFull} />
		<label for="{idPrefix}-full">Show full layer spec</label>
	</div>

	{#if full}
		{@render labelRow('layer', 'Layer', fullText)}
		<textarea
			class="gl-style-editor-manual__text gl-style-editor-manual__text--full"
			id="{idPrefix}-layer"
			spellcheck="false"
			readonly
			value={fullText}></textarea>
		<p class="gl-style-editor-manual__error" role="alert" hidden={!error}>{error ?? ''}</p>
	{:else}
		{#each types as type (type)}
			{@render labelRow(type, LABELS[type], texts[type])}
			<textarea
				class="gl-style-editor-manual__text"
				id="{idPrefix}-{type}"
				spellcheck="false"
				bind:value={texts[type]}></textarea>
		{/each}

		<p class="gl-style-editor-manual__error" role="alert" hidden={!error}>{error ?? ''}</p>

		<div class="gl-style-editor-manual__actions">
			<span class="gl-style-editor-manual__status" aria-live="polite"
				>{applied ? 'Applied' : ''}</span
			>
			<Button
				variant="primary"
				icon={Check}
				iconName="apply"
				label="Apply"
				disabled={!changed}
				onclick={apply}
			/>
		</div>
	{/if}
</div>

<style>
	.gl-style-editor-manual {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gl-style-editor-manual__toolbar {
		display: flex;
	}

	.gl-style-editor-manual__full {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
		color: var(--gl-style-editor-foreground);
	}

	.gl-style-editor-manual__full label {
		cursor: pointer;
	}

	.gl-style-editor-manual__label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
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

	.gl-style-editor-manual__text--full {
		height: 320px;
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
		white-space: pre-line;
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
