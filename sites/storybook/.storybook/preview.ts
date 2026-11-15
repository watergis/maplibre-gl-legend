import type { Preview } from '@storybook/html-vite';
import { themes } from 'storybook/theming';
import { isDarkMode } from './mode';

const preview: Preview = {
	parameters: {
		docs: { theme: isDarkMode() ? themes.dark : themes.light }
	}
};

export default preview;
