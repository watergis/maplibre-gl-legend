<script lang="ts">
	import mapboxgl, { Map, NavigationControl } from 'mapbox-gl';
	import { MapboxLegendControl } from '@watergis/mapbox-gl-legend';
	import { PUBLIC_MAPBOX_ACCESSTOKEN } from '$app/env/public';
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@watergis/mapbox-gl-legend/dist/mapbox-gl-legend.css';
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

	const hasToken = !!PUBLIC_MAPBOX_ACCESSTOKEN;

	onMount(() => {
		if (!mapContainer) return;
		if (!hasToken) return;
		mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESSTOKEN;

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
				new MapboxLegendControl(options.useTargets ? TARGETS : {}, toLegendOptions(options)),
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
	<DemoNotice library="Mapbox GL JS" />
	{#if !hasToken}
		<div class="absolute inset-0 flex items-center justify-center p-4">
			<p class="card preset-outlined-warning-500 p-4 text-center">
				Mapbox access token is not configured. Set <code class="code"
					>PUBLIC_MAPBOX_ACCESSTOKEN</code
				>
				in <code class="code">sites/demo/.env</code> to run this demo.
			</p>
		</div>
	{/if}
</div>
