<script lang="ts">
	import { addProtocol, Map, NavigationControl, setWorkerUrl } from 'maplibre-gl';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';
	import { Protocol } from 'pmtiles';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
	import {
		CENTER,
		MAPLIBRE_DEFAULTS,
		MAPLIBRE_FIELDS,
		STYLE_URL,
		TARGETS,
		ZOOM,
		optionsToSearchParams,
		searchParamsToOptions,
		toMaplibreLegendOptions,
		type MaplibreDemoOptions
	} from '#lib/demo.js';
	import OptionsPanel from '#lib/OptionsPanel.svelte';
	import DemoNotice from '#lib/DemoNotice.svelte';

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;
	let control: MaplibreLegendControl | undefined;
	let loaded = $state(false);

	// options are read from the URL, so that a configured demo can be shared
	let options: MaplibreDemoOptions = $state(
		searchParamsToOptions(page.url.searchParams, MAPLIBRE_DEFAULTS)
	);

	setWorkerUrl(workerUrl);

	onMount(() => {
		if (!mapContainer) return;
		const protocol = new Protocol();
		addProtocol('pmtiles', protocol.tile);

		map = new Map({
			container: mapContainer,
			style: STYLE_URL,
			center: CENTER,
			zoom: ZOOM,
			hash: true
		});
		map.addControl(new NavigationControl({}), 'top-right');

		map.once('load', () => {
			loaded = true;
		});
	});

	// (re)create the legend control whenever the options are changed in the panel
	$effect(() => {
		if (!loaded) return;
		const targets = options.useTargets ? TARGETS : {};
		const legendOptions = toMaplibreLegendOptions(options);
		untrack(() => {
			if (!map) return;
			if (control) map.removeControl(control);
			control = new MaplibreLegendControl(targets, legendOptions);
			map.addControl(control, 'top-right');

			// keep the map position in the hash
			const query = optionsToSearchParams(options, MAPLIBRE_DEFAULTS).toString();
			const href = `${resolve('/maplibre')}${query ? `?${query}` : ''}${window.location.hash}`;
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			replaceState(href, page.state);
		});
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div class="relative w-full h-full">
	<div class="w-full h-full" bind:this={mapContainer}></div>
	<OptionsPanel bind:options defaults={MAPLIBRE_DEFAULTS} fields={MAPLIBRE_FIELDS} />
	<DemoNotice library="MapLibre GL JS" />
</div>
