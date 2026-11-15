/**
 * Copy the Storybook of maplibre2svg, built by its `build-storybook` script, into
 * static/maplibre2svg/storybook/, so that the demo site serves it at /maplibre2svg/storybook/. The
 * page /maplibre2svg/stories shows it under the header of the demo.
 *
 * The API reference of all packages is written to static/docs/ by `pnpm build:docs` at the root.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, '../../../packages/maplibre2svg/site/storybook');
const to = resolve(here, '../static/maplibre2svg/storybook');

if (!existsSync(from)) {
	console.error(`${from} is missing: run "pnpm build-storybook" in packages/maplibre2svg`);
	process.exit(1);
}
rmSync(resolve(to, '..'), { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log(`copied ${from} to ${to}`);
