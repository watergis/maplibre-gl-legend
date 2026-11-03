<script lang="ts">
	import IconMoon from '@lucide/svelte/icons/moon';
	import IconSun from '@lucide/svelte/icons/sun';
	import { onMount } from 'svelte';

	const localStorageKey = 'light-dark-mode';

	let isDark = $state(false);

	const applyMode = (dark: boolean) => {
		isDark = dark;
		document.documentElement.setAttribute('data-mode', dark ? 'dark' : 'light');
	};

	onMount(() => {
		let stored: string | null = null;
		try {
			stored = localStorage.getItem(localStorageKey);
		} catch {
			// localStorage may be unavailable
		}
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyMode(stored ? stored === 'dark' : prefersDark);
	});

	const toggle = () => {
		applyMode(!isDark);
		try {
			localStorage.setItem(localStorageKey, isDark ? 'dark' : 'light');
		} catch {
			// localStorage may be unavailable
		}
	};
</script>

<button
	type="button"
	class="btn hover:preset-tonal px-1 md:px-2"
	onclick={toggle}
	title="Toggle light/dark mode"
	aria-label="Toggle light/dark mode"
>
	{#if isDark}
		<IconMoon />
	{:else}
		<IconSun />
	{/if}
</button>
