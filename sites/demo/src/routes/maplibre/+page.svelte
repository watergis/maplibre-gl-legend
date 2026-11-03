<script lang="ts">
	import { addProtocol, Map, NavigationControl, setWorkerUrl } from 'maplibre-gl';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';
	import { Protocol } from 'pmtiles';
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
	import {
		CENTER,
		STYLE_URL,
		TARGETS,
		ZOOM,
		searchParamsToOptions,
		toLegendOptions
	} from '#lib/demo.js';
	import DemoNotice from '#lib/DemoNotice.svelte';

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;

	setWorkerUrl(workerUrl);

	onMount(() => {
		if (!mapContainer) return;
		const protocol = new Protocol();
		addProtocol('pmtiles', protocol.tile);

		const options = searchParamsToOptions(page.url.searchParams);

		map = new Map({
			container: mapContainer,
			style: STYLE_URL,
			center: CENTER,
			zoom: ZOOM,
			hash: true
		});
		map.addControl(new NavigationControl({}), 'top-right');

		map.once('load', () => {
			if (!map) return;
			// legend control configured on the top page
			map.addControl(
				new MaplibreLegendControl(options.useTargets ? TARGETS : {}, toLegendOptions(options)),
				'top-right'
			);
		});
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div class="relative w-full h-full">
	<div class="w-full h-full" bind:this={mapContainer}></div>
	<DemoNotice library="MapLibre GL JS" />
</div>
