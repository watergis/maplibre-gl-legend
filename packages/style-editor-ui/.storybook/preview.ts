import type { Preview } from '@storybook/sveltekit';
import '../src/lib/theme.css';
import './preview.css';

// the theme of the editor (`--gl-style-editor-*` custom properties) applies to every story
document.body.classList.add('gl-style-editor-theme');

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
