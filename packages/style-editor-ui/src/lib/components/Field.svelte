<!-- Form row of a property: its label with a link to the specification, then the control -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayerType, PropertyType } from '../interfaces';
	import HelpLink from './HelpLink.svelte';

	interface Props {
		/** added as `gl-style-editor-field--{name}`, usually the property name */
		name: string;
		label: string;
		/** id of the control the label is for */
		id?: string;
		/** the specification linked from the label */
		help?: { layerType: LayerType; type?: PropertyType; property?: string };
		/** `inline` puts the control on the line of the label */
		inline?: boolean;
		/** the control */
		children: Snippet;
	}

	let { name, label, id, help, inline = false, children }: Props = $props();
</script>

<div
	class={[
		'gl-style-editor-field',
		`gl-style-editor-field--${name}`,
		inline && 'gl-style-editor-field--inline'
	]}
>
	<div class="gl-style-editor-field__header">
		<label class="gl-style-editor-field__label" for={id}>{label}</label>
		{#if help}
			<HelpLink {...help} />
		{/if}
	</div>
	<div class="gl-style-editor-field__control">
		{@render children()}
	</div>
</div>

<style>
	.gl-style-editor-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gl-style-editor-field__header {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	.gl-style-editor-field__label {
		overflow: hidden;
		color: var(--gl-style-editor-foreground);
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.gl-style-editor-field__control {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.gl-style-editor-field--inline {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.gl-style-editor-field--inline .gl-style-editor-field__control {
		flex-direction: row;
	}
</style>
