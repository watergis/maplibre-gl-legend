<script lang="ts" generics="T extends Record<string, boolean | string>">
	import IconChevronDown from '@lucide/svelte/icons/chevron-down';
	import IconSettings from '@lucide/svelte/icons/settings-2';
	import type { OptionField } from './demo.js';

	interface Props {
		/** the options edited in the panel */
		options: T;
		/** values restored by the reset button */
		defaults: T;
		/** the fields shown in the panel, in this order */
		fields: OptionField[];
	}

	let { options = $bindable(), defaults, fields }: Props = $props();

	let open = $state(true);

	let booleanFields = $derived(fields.filter((f) => typeof defaults[f.key] === 'boolean'));
	let textFields = $derived(fields.filter((f) => typeof defaults[f.key] === 'string'));

	const setValue = (key: string, value: boolean | string) => {
		options = { ...options, [key]: value };
	};
</script>

<div
	class="absolute top-2 left-2 z-10 card preset-filled-surface-50-950 shadow-lg text-sm w-64 max-w-[calc(100%-1rem)] max-h-[calc(100%-4rem)] flex flex-col"
>
	<button
		type="button"
		class="flex items-center gap-2 px-3 py-2 font-bold w-full"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<IconSettings size={16} />
		<span class="flex-1 text-left">Options</span>
		<IconChevronDown size={16} class="transition-transform {open ? '' : '-rotate-90'}" />
	</button>
	{#if open}
		<div class="px-3 pb-3 space-y-3 overflow-y-auto">
			<div class="space-y-1">
				{#each booleanFields as field (field.key)}
					<label class="flex items-center space-x-2">
						<input
							class="checkbox"
							type="checkbox"
							checked={options[field.key] as boolean}
							onchange={(e) => setValue(field.key, e.currentTarget.checked)}
						/>
						<span>{field.label}</span>
					</label>
				{/each}
			</div>
			{#each textFields as field (field.key)}
				<label class="label">
					<span class="label-text">{field.label}</span>
					<input
						class="input"
						type="text"
						value={options[field.key] as string}
						onchange={(e) => setValue(field.key, e.currentTarget.value)}
					/>
				</label>
			{/each}
			<button
				type="button"
				class="btn btn-sm preset-outlined-surface-500 w-full"
				onclick={() => (options = { ...defaults })}
			>
				Reset options
			</button>
		</div>
	{/if}
</div>
