/**
 * Copy the API reference and the Storybook of maplibre2svg, built by its `build:site` script,
 * into static/maplibre2svg/, so that the demo site serves them at /maplibre2svg/docs/ and
 * /maplibre2svg/storybook/. The pages /maplibre2svg/api-reference and /maplibre2svg/stories show
 * them under the header of the demo.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, '../../../packages/maplibre2svg/site');
const to = resolve(here, '../static/maplibre2svg');

for (const name of ['docs', 'storybook']) {
	if (!existsSync(resolve(from, name))) {
		console.error(
			`${resolve(from, name)} is missing: run "pnpm build:site" in packages/maplibre2svg`
		);
		process.exit(1);
	}
}
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log(`copied ${from} to ${to}`);
