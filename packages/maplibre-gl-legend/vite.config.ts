import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/lib/index.ts'),
			name: 'MaplibreLegendControl',
			fileName: (format) => `maplibre-gl-legend.${format}.js`,
			formats: ['es']
		},
		rollupOptions: {
			external: ['maplibre-gl'] // バンドルしたくない依存関係を指定
		}
	},
	plugins: []
});
