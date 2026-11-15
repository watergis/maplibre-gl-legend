import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf', '@storybook/addon-a11y', '@storybook/addon-docs'],
	framework: '@storybook/sveltekit',
	viteFinal: (config) => {
		config.plugins = [
			...(config.plugins ?? []),
			{
				// SvelteKit answers /favicon.ico with its error page, which fails inside Storybook
				name: 'storybook-favicon',
				configureServer(server) {
					server.middlewares.use('/favicon.ico', (_req, res) => {
						res.statusCode = 204;
						res.end();
					});
				}
			}
		];
		return config;
	}
};
export default config;
