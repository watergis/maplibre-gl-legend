<!-- Shown instead of a control when the value is an expression which only the manual editor edits -->
<script lang="ts">
	import { Code } from '@lucide/svelte';
	import Icon from '../components/Icon.svelte';
	import { getEditorContext } from '../context';

	interface Props {
		value: unknown;
	}

	let { value }: Props = $props();

	const context = getEditorContext();
	const text = $derived(JSON.stringify(value));
</script>

<div class="gl-style-editor-expression">
	<code class="gl-style-editor-expression__code" title={text}>{text}</code>
	<button
		type="button"
		class="gl-style-editor-expression__edit"
		onclick={() => context.openManualEditor()}
	>
		<Icon icon={Code} name="manualEditor" />
		<span>Edit in the manual editor</span>
	</button>
</div>

<style>
	.gl-style-editor-expression {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		min-width: 0;
	}

	.gl-style-editor-expression__code {
		display: block;
		width: 100%;
		padding: 6px 8px;
		overflow: hidden;
		border-radius: var(--gl-style-editor-radius-sm);
		background: var(--gl-style-editor-muted);
		color: var(--gl-style-editor-muted-foreground);
		font-family: var(--gl-style-editor-mono-font);
		font-size: 11px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.gl-style-editor-expression__edit {
		--gl-style-editor-icon-size: 14px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0;
		border: none;
		background: none;
		color: var(--gl-style-editor-primary);
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.gl-style-editor-expression__edit:hover,
	.gl-style-editor-expression__edit:focus-visible {
		outline: none;
		text-decoration: underline;
	}
</style>
