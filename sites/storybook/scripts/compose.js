/**
 * Copy the Storybooks of the packages, built by their `build-storybook` scripts, next to the
 * composed Storybook in build/, where `.storybook/main.ts` refers to them (`./maplibre2svg`,
 * `./legend-ui` and `./style-editor-ui`).
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packages = resolve(here, '../../../packages');
const build = resolve(here, '../build');

const REFS = {
	maplibre2svg: resolve(packages, 'maplibre2svg/site/storybook'),
	'legend-ui': resolve(packages, 'legend-ui/storybook-static'),
	'style-editor-ui': resolve(packages, 'style-editor-ui/storybook-static')
};

if (!existsSync(build)) {
	console.error(`${build} is missing: run "storybook build -o build" first`);
	process.exit(1);
}
for (const [name, from] of Object.entries(REFS)) {
	if (!existsSync(from)) {
		console.error(`${from} is missing: run "pnpm build-storybook" in packages/${name}`);
		process.exit(1);
	}
	const to = resolve(build, name);
	rmSync(to, { recursive: true, force: true });
	cpSync(from, to, { recursive: true });
	console.log(`copied ${from} to ${to}`);
}
