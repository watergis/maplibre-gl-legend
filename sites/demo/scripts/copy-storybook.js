/**
 * Copy the Storybook of all packages, built by `pnpm build-storybook` in sites/storybook, into
 * static/storybook/, so that the demo site serves it at /storybook/. The page /stories shows it
 * under the header of the demo.
 *
 * The API reference of all packages is written to static/docs/ by `pnpm build:docs` at the root.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, '../../storybook/build');
const to = resolve(here, '../static/storybook');

if (!existsSync(from)) {
	console.error(`${from} is missing: run "pnpm --filter @watergis/storybook build-storybook"`);
	process.exit(1);
}
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log(`copied ${from} to ${to}`);
