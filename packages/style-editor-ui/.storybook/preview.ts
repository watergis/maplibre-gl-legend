import type { Preview } from '@storybook/sveltekit';
import '../src/lib/theme.css';
import './preview.css';

// the theme of the editor (`--gl-style-editor-*` custom properties) applies to every story
document.body.classList.add('gl-style-editor-theme');

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i
			}
		},
		a11y: {
			test: 'todo'
		}
	}
};

export default preview;
