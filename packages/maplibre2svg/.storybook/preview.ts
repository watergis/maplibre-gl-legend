import type { Preview } from '@storybook/html-vite';
import { themes } from 'storybook/theming';
import { isDarkMode } from './mode';

const dark = isDarkMode();

const BACKGROUNDS = {
	light: { name: 'Light', value: '#ffffff' },
	dark: { name: 'Dark', value: '#1e1e1e' }
};

const preview: Preview = {
	// a Docs page per stories file, with every story; the layer types attach their own MDX page
	tags: ['autodocs'],
	parameters: {
		backgrounds: { options: BACKGROUNDS },
		controls: { expanded: true },
		// the Docs pages have no toolbar to switch the background, so they follow the mode instead
		docs: { theme: dark ? themes.dark : themes.light },
		options: {
			storySort: {
				order: [
					'Introduction',
					'Layers',
					['*', ['Docs', '*']],
					'Example Maplibre Style',
					['Docs', '*']
				]
			}
		}
	},
	initialGlobals: {
		backgrounds: { value: dark ? 'dark' : 'light' }
	},
	decorators: [
		(story, context) => {
			// keep the labels readable on the dark background
			const wrapper = document.createElement('div');
			const dark =
				(context.globals.backgrounds as { value?: string } | undefined)?.value === 'dark';
			wrapper.style.color = dark ? '#eeeeee' : '#222222';
			const content = story();
			if (typeof content === 'string') wrapper.innerText = content;
			else wrapper.append(content);
			return wrapper;
		}
	]
};

export default preview;
