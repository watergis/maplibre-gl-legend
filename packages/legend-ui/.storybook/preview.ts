import type { Preview } from '@storybook/sveltekit';
import { themes } from 'storybook/theming';
import { isDarkMode } from './mode';

const dark = isDarkMode();

const preview: Preview = {
	// a Docs page per stories file, with every story; each stories file attaches its own MDX page
	tags: ['autodocs'],
	parameters: {
		controls: {
			expanded: true
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
					'Panel',
					['*', ['Docs', '*']],
					'Tree',
					['*', ['Docs', '*']],
					'Components',
					['*', ['Docs', '*']]
				]
			}
		}
	}
};

export default preview;
