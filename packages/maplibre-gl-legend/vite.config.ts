import { resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { transform } from 'lightningcss';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const CSS_FILE_NAME = 'maplibre-gl-legend';

/**
 * Emit a minified copy of the CSS of the plugin, `maplibre-gl-legend.min.css`, next to the
 * readable `maplibre-gl-legend.css`.
 */
const minifiedCss = (): Plugin => ({
	name: 'maplibre-gl-legend:minified-css',
	apply: 'build',
	// after Vite has added the CSS to the bundle
	enforce: 'post',
	generateBundle(_, bundle) {
		const css = bundle[`${CSS_FILE_NAME}.css`];
		if (css?.type !== 'asset') return;
		const { code } = transform({
			filename: css.fileName,
			code: Buffer.from(css.source),
			minify: true
		});
		this.emitFile({ type: 'asset', fileName: `${CSS_FILE_NAME}.min.css`, source: code });
	}
});

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: true,
		// the readable CSS; `minifiedCss` adds the minified one
		cssMinify: false,
		lib: {
			entry: resolve(__dirname, 'src/lib/index.ts'),
			name: 'MaplibreLegendControl',
			fileName: (format) => `maplibre-gl-legend.${format}.js`,
			// the styles of the plugin and of the Svelte components of the style editor, in one file
			cssFileName: CSS_FILE_NAME,
			formats: ['es']
		},
		rollupOptions: {
			external: ['maplibre-gl'] // バンドルしたくない依存関係を指定
		}
	},
	plugins: [
		minifiedCss(),
		// the style editor (`@watergis/style-editor-ui`) is written in Svelte and bundled into the plugin
		svelte(),
		// a single `index.d.ts`, with the types of the unpublished workspace packages inlined
		dts({
			tsconfigPath: './tsconfig.json',
			entryRoot: 'src/lib',
			outDirs: 'dist/types',
			bundleTypes: {
				bundledPackages: ['@watergis/style-editor-ui', '@watergis/maplibre2svg']
			}
		})
	],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler'
			}
		}
	}
});
