import type { Preview } from '@storybook/html-vite';

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
		backgrounds: { value: 'light' }
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
