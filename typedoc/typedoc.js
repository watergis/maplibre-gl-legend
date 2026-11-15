/*
 * TypeDoc writes the ```mermaid blocks of the README as <pre><code class="mermaid">, without
 * highlighting. Draw them as diagrams with Mermaid, in the theme of the page, and again when the
 * reader switches the theme.
 */
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
/** the smallest scale a diagram is shrunk to, so that its text stays readable */
const MIN_SCALE = 0.65;

/** Whether the page is dark: TypeDoc's theme setting, or the OS for "os" */
function isDark() {
	const theme = document.documentElement.dataset.theme;
	if (theme === 'dark') return true;
	if (theme === 'light') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

async function drawDiagrams() {
	const blocks = [...document.querySelectorAll('pre > code.mermaid')];
	if (blocks.length === 0) return;
	const { default: mermaid } = await import(MERMAID);

	// replace each block by a container which keeps its source, to draw it again later
	const containers = blocks.map((code) => {
		const div = document.createElement('div');
		div.className = 'mermaid-diagram';
		div.dataset.source = code.textContent ?? '';
		code.parentElement?.replaceWith(div);
		return div;
	});

	let drawn = 0;
	const draw = async () => {
		mermaid.initialize({ startOnLoad: false, theme: isDark() ? 'dark' : 'default' });
		for (const div of containers) {
			try {
				const { svg } = await mermaid.render(`mermaid-${drawn++}`, div.dataset.source ?? '');
				div.innerHTML = svg;
				// fit the width of the page, but not smaller than MIN_SCALE: a wider diagram scrolls
				const box = div.querySelector('svg')?.viewBox.baseVal;
				if (box?.width) div.firstElementChild.style.minWidth = `${box.width * MIN_SCALE}px`;
			} catch (error) {
				// show the source of a diagram which does not parse, instead of nothing
				console.error(error);
				const pre = document.createElement('pre');
				pre.textContent = div.dataset.source ?? '';
				div.replaceChildren(pre);
			}
		}
	};
	await draw();

	let dark = isDark();
	const redrawIfChanged = () => {
		if (isDark() === dark) return;
		dark = isDark();
		void draw();
	};
	new MutationObserver(redrawIfChanged).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawIfChanged);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => void drawDiagrams());
} else {
	void drawDiagrams();
}

/*
 * The demo site shows this reference in a frame under its header. The navigation links lead to
 * other pages of the demo (the Storybook), so open them in the whole window, not in the frame.
 */
function openNavigationLinksInWindow() {
	for (const link of document.querySelectorAll('#tsd-toolbar-links a, #tsd-sidebar-links a')) {
		link.target = '_top';
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', openNavigationLinksInWindow);
} else {
	openNavigationLinksInWindow();
}
