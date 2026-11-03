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
			name: 'MapboxLegendControl',
			fileName: (format) => `mapbox-gl-legend.${format}.js`,
			formats: ['es']
		},
		rollupOptions: {
			external: ['mapbox-gl'] // バンドルしたくない依存関係を指定
		}
	},
	plugins: []
});
