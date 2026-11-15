import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.ts'],
	addons: ['@storybook/addon-docs'],
	framework: { name: '@storybook/html-vite', options: {} },
	viteFinal: (viteConfig) => {
		// vite.config.ts builds the library; Storybook builds an app with the same config
		if (viteConfig.build) viteConfig.build.lib = false;
		return viteConfig;
	}
};

export default config;
