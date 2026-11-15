/**
 * Whether Storybook is shown in dark mode. The demo site embeds this Storybook from the same
 * origin and stores its light/dark switch under the same key (sites/demo/src/lib/LightSwitch.svelte),
 * so the embedded Storybook follows it; without a stored mode it follows the OS setting.
 */
export function isDarkMode(): boolean {
	try {
		const stored = localStorage.getItem('light-dark-mode');
		if (stored) return stored === 'dark';
	} catch {
		// localStorage may be unavailable
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
