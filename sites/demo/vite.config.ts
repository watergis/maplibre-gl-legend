import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			extensions: ['.svelte'],
			preprocess: [vitePreprocess()],
			// the site is deployed to Cloudflare as static assets (see wrangler.jsonc at the repository root)
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true
			})
		})
	],
	ssr: {
		noExternal: ['maplibre-gl', 'mapbox-gl']
	}
});
