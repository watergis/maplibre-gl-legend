import type { StorybookConfig } from '@storybook/html-vite';

/**
 * The Storybook of all packages: an introduction, and the Storybooks of the packages composed
 * into it (https://storybook.js.org/docs/sharing/storybook-composition).
 *
 * In development the packages run their own Storybook (`pnpm storybook` in each package). Once
 * built, `scripts/compose.js` copies their Storybooks next to this one.
 */
const config: StorybookConfig = {
	stories: ['../src/**/*.mdx'],
	addons: ['@storybook/addon-docs'],
	framework: { name: '@storybook/html-vite', options: {} },
	refs: (_config, { configType }) => {
		const development = configType === 'DEVELOPMENT';
		return {
			maplibre2svg: {
				title: 'maplibre2svg',
				url: development ? 'http://localhost:6006' : './maplibre2svg',
				expanded: true
			},
			'style-editor-ui': {
				title: 'style-editor-ui',
				url: development ? 'http://localhost:6008' : './style-editor-ui',
				expanded: true
			}
		};
	}
};

export default config;
