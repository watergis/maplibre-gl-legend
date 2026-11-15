import type { Preview } from '@storybook/sveltekit';
import { themes } from 'storybook/theming';
import '../src/lib/theme.css';
import { isDarkMode } from './mode';
import './preview.css';

const dark = isDarkMode();

// the theme of the editor (`--gl-style-editor-*` custom properties) applies to every story, and
// its `light-dark()` colors follow the light/dark mode of Storybook
document.body.classList.add('gl-style-editor-theme');
document.documentElement.style.colorScheme = dark ? 'dark' : 'light';

const preview: Preview = {
	// a Docs page per stories file, with every story; each stories file attaches its own MDX page
	tags: ['autodocs'],
	parameters: {
		controls: {
			expanded: true,
			matchers: {
				color: /(background|color)$/i
			}
		},
		// the Docs pages have no toolbar to switch the background, so they follow the mode instead
		docs: { theme: dark ? themes.dark : themes.light },
		a11y: {
			test: 'todo'
		},
		options: {
			// read statically by Storybook: no variables here. Each group opens with its Docs page
			storySort: {
				order: [
					'Introduction',
					'Dialog',
					['*', ['Docs', '*']],
					'Panels',
					['*', ['Docs', '*']],
					'Controls',
					['*', ['Docs', '*']],
					'Components',
					['*', ['Docs', '*']]
				]
			}
		}
	}
};

export default preview;
