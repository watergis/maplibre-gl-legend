<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { SegmentedControl, Tabs } from '@skeletonlabs/skeleton-svelte';
	import type { PageData } from './$types';
	import CodeBlock from '#lib/CodeBlock.svelte';
	import {
		CENTER,
		DEFAULT_OPTIONS,
		STYLE_URL,
		TARGETS,
		ZOOM,
		optionsToSearchParams,
		toLegendOptions,
		type DemoOptions,
		type MapLibrary
	} from '#lib/demo.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const libraries: { label: string; value: MapLibrary; packageName: string }[] = [
		{ label: 'MapLibre GL Legend', value: 'maplibre', packageName: '@watergis/maplibre-gl-legend' },
		{ label: 'Mapbox GL Legend', value: 'mapbox', packageName: '@watergis/mapbox-gl-legend' }
	];
	let library = $state<MapLibrary>('maplibre');
	let versions: Record<MapLibrary, string> = $state({ maplibre: 'latest', mapbox: 'latest' });
	let cdnTemplates: Record<MapLibrary, string> = $state({ maplibre: '', mapbox: '' });

	let options: DemoOptions = $state({ ...DEFAULT_OPTIONS });
	let mapboxToken = $state('Your access token');
	let packageManager = $state('npm');

	const importTypes = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importType = $state('npm');

	const booleanOptions: { key: keyof DemoOptions; label: string }[] = [
		{ key: 'showDefault', label: 'showDefault' },
		{ key: 'showCheckbox', label: 'showCheckbox' },
		{ key: 'onlyRendered', label: 'onlyRendered' },
		{ key: 'reverseOrder', label: 'reverseOrder' },
		{ key: 'useTargets', label: 'Show only target layers' }
	];

	let isMapbox = $derived(library === 'mapbox');
	let packageName = $derived(`@watergis/${library}-gl-legend`);
	let controlName = $derived(isMapbox ? 'MapboxLegendControl' : 'MaplibreLegendControl');
	let peerDependency = $derived(isMapbox ? 'mapbox-gl' : 'maplibre-gl');

	let demoHref = $derived.by(() => {
		const query = optionsToSearchParams(options).toString();
		const path = isMapbox ? resolve('/mapbox') : resolve('/maplibre');
		return query ? `${path}?${query}` : path;
	});

	const indent = (value: string, prefix: string) => value.replace(/\n/g, `\n${prefix}`);

	let targetsCode = $derived(options.useTargets ? JSON.stringify(TARGETS, null, '\t') : '{}');
	let optionsCode = $derived(JSON.stringify(toLegendOptions(options), null, '\t'));

	let installCommand = $derived.by(() => {
		const packages = `${packageName} ${peerDependency}`;
		if (packageManager === 'yarn') return `yarn add --dev ${packages}`;
		if (packageManager === 'pnpm') return `pnpm add --save-dev ${packages}`;
		return `npm install --save-dev ${packages}`;
	});

	let usageCode = $derived(
		`
import ${isMapbox ? 'mapboxgl, { Map }' : '{ Map, setWorkerUrl }'} from '${peerDependency}';
import '${peerDependency}/dist/${peerDependency}.css';
${isMapbox ? '' : `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';\n`}import { ${controlName} } from '${packageName}';
import '${packageName}/dist/${library}-gl-legend.css';

${isMapbox ? `mapboxgl.accessToken = '${mapboxToken}';` : 'setWorkerUrl(workerUrl);'}

const map = new Map({
	container: 'map',
	style: '${STYLE_URL}',
	center: [${CENTER.join(', ')}],
	zoom: ${ZOOM}
});

// please add legend control after the style is loaded
map.on('load', () => {
	// layer id and its title shown in the legend. Pass {} to show all layers.
	const targets = ${indent(targetsCode, '\t')};
	const options = ${indent(optionsCode, '\t')};
	map.addControl(new ${controlName}(targets, options), 'top-right');
});
`.trim()
	);

	let cdnCode = $derived(
		cdnTemplates[library]
			.replace(/{version}/g, versions[library])
			.replace(/{style}/g, STYLE_URL)
			.replace(/{center}/g, CENTER.join(', '))
			.replace(/{zoom}/g, String(ZOOM))
			.replace(/{accesstoken}/g, mapboxToken)
			.replace(/{targets}/g, indent(targetsCode, '\t\t\t\t'))
			.replace(/{options}/g, indent(optionsCode, '\t\t\t\t'))
	);

	const parameters = $derived([
		{
			name: 'targets',
			default: '{}',
			description:
				'The first argument of the constructor. An object of layer ID and its title shown in the legend. If it is empty, all layers in the style are shown.'
		},
		{
			name: 'showDefault',
			default: 'true',
			description:
				'true: the legend panel is opened as default. false: the panel is closed and only the button is shown.'
		},
		{
			name: 'showCheckbox',
			default: 'true',
			description: "true: a checkbox to switch each layer's visibility is added."
		},
		{
			name: 'reverseOrder',
			default: 'true',
			description: 'true: layers are ordered from top. false: layers are ordered from bottom.'
		},
		{
			name: 'onlyRendered',
			default: 'true',
			description:
				"true: only rendered layers are shown in the legend as default. false: all layers' legend are shown. Users can switch it from the panel."
		},
		{
			name: 'title',
			default: 'Legend',
			description: 'The text shown above the legend.'
		},
		{
			name: 'onlyRenderedLabel',
			default: 'Only rendered',
			description:
				'The label text of the "Only rendered" checkbox. Use it to translate the label into other languages.'
		},
		...(isMapbox
			? [
					{
						name: 'accessToken',
						default: 'mapboxgl.accessToken',
						description: 'Mapbox access token used to load `mapbox://` sprites.'
					}
				]
			: [])
	]);

	const fetchVersion = async (value: MapLibrary, name: string) => {
		const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
		if (!res.ok) return;
		const json = await res.json();
		versions[value] = json.version;
	};

	const fetchCdnTemplate = async (value: MapLibrary) => {
		const res = await fetch(`/assets/${value}-cdn-example.txt`);
		if (!res.ok) return;
		cdnTemplates[value] = await res.text();
	};

	onMount(() => {
		for (const lib of libraries) {
			fetchVersion(lib.value, lib.packageName);
			fetchCdnTemplate(lib.value);
		}
	});
</script>

<div class="max-w-5xl mx-auto px-4 pb-12">
	<section class="text-center">
		<h2 class="h1 pt-6 pb-6">{data.metadata.title}</h2>
		<p class="pb-6 max-w-3xl mx-auto">{data.metadata.description}</p>
		<img
			class="h-auto w-full max-w-[640px] mx-auto rounded-lg shadow-lg"
			src="/assets/plugin-demo.gif"
			alt="Overview of the plugin"
		/>
	</section>

	<section class="space-y-4">
		<h3 class="h3 pt-10">Select a map library</h3>
		<SegmentedControl
			value={library}
			onValueChange={(details) => (library = details.value as MapLibrary)}
			class="w-fit max-w-full"
		>
			<SegmentedControl.Control class="flex-wrap">
				<SegmentedControl.Indicator />
				{#each libraries as lib (lib.value)}
					<SegmentedControl.Item value={lib.value}>
						<SegmentedControl.ItemText>
							{lib.label} ({versions[lib.value]})
						</SegmentedControl.ItemText>
						<SegmentedControl.ItemHiddenInput />
					</SegmentedControl.Item>
				{/each}
			</SegmentedControl.Control>
		</SegmentedControl>
	</section>

	<section class="space-y-4">
		<h3 class="h3 pt-10">Try options</h3>
		<p>Change the options below and open the demo. The usage code is updated as well.</p>

		<div class="card preset-outlined-surface-200-800 p-4 grid gap-4 md:grid-cols-2">
			<div class="space-y-2">
				{#each booleanOptions as opt (opt.key)}
					<label class="flex items-center space-x-2">
						<input class="checkbox" type="checkbox" bind:checked={options[opt.key] as boolean} />
						<span>{opt.label}</span>
					</label>
				{/each}
			</div>
			<div class="space-y-3">
				<label class="label">
					<span class="label-text">title</span>
					<input class="input" type="text" bind:value={options.title} />
				</label>
				<label class="label">
					<span class="label-text">onlyRenderedLabel</span>
					<input class="input" type="text" bind:value={options.onlyRenderedLabel} />
				</label>
				{#if isMapbox}
					<label class="label">
						<span class="label-text">Mapbox access token (only used in the code below)</span>
						<input class="input" type="text" bind:value={mapboxToken} />
					</label>
				{/if}
			</div>
		</div>

		<div class="flex flex-wrap gap-2">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a class="btn preset-filled-primary-500 btn-lg" href={demoHref}>
				Open {isMapbox ? 'Mapbox' : 'MapLibre'} GL JS DEMO
			</a>
			<button
				type="button"
				class="btn preset-outlined-surface-500 btn-lg"
				onclick={() => (options = { ...DEFAULT_OPTIONS })}
			>
				Reset options
			</button>
		</div>
	</section>

	<section class="pt-10">
		<Tabs value={importType} onValueChange={(details) => (importType = details.value)}>
			<Tabs.List>
				{#each importTypes as tab (tab.value)}
					<Tabs.Trigger value={tab.value}>{tab.label}</Tabs.Trigger>
				{/each}
				<Tabs.Indicator />
			</Tabs.List>

			<Tabs.Content value="npm">
				<div class="space-y-4">
					<h3 class="h3 pt-6">Install</h3>
					<SegmentedControl
						value={packageManager}
						onValueChange={(details) => (packageManager = details.value ?? 'npm')}
						class="w-fit"
					>
						<SegmentedControl.Control>
							<SegmentedControl.Indicator />
							{#each ['npm', 'yarn', 'pnpm'] as pm (pm)}
								<SegmentedControl.Item value={pm}>
									<SegmentedControl.ItemText>{pm}</SegmentedControl.ItemText>
									<SegmentedControl.ItemHiddenInput />
								</SegmentedControl.Item>
							{/each}
						</SegmentedControl.Control>
					</SegmentedControl>
					<CodeBlock lang="console" showLineNumber={false} code={installCommand} />

					<h3 class="h3 pt-6">Usage</h3>
					<p>Copy and paste the below code.</p>
					<CodeBlock lang="js" code={usageCode} />
				</div>
			</Tabs.Content>

			<Tabs.Content value="cdn">
				<div class="space-y-4">
					<h3 class="h3 pt-6">Usage</h3>
					<p>
						The plugin is distributed as an ES module. Copy and paste the below HTML to use it from
						CDN.
					</p>
					<CodeBlock lang="html" code={cdnCode} />
				</div>
			</Tabs.Content>
		</Tabs>
	</section>

	<section class="space-y-4">
		<h3 class="h3 pt-10">Parameters</h3>
		<p>
			The first argument of the constructor is the target layers, and the second argument accepts
			the following options.
		</p>
		<div class="table-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Parameter</th>
						<th>Default value</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each parameters as param (param.name)}
						<tr>
							<td><code class="code">{param.name}</code></td>
							<td>{param.default}</td>
							<td>{param.description}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="flex justify-center pt-6">
			<a
				class="btn preset-outlined-surface-500"
				href="https://github.com/watergis/maplibre-gl-legend/tree/main/packages/{library}-gl-legend#readme"
				target="_blank"
				rel="noreferrer">See implementation</a
			>
		</div>
	</section>
</div>
