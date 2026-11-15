<script lang="ts">
	import mapboxgl, { Map, NavigationControl } from 'mapbox-gl';
	import { MapboxLegendControl } from '@watergis/mapbox-gl-legend';
	import { PUBLIC_MAPBOX_ACCESSTOKEN } from '$app/env/public';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@watergis/mapbox-gl-legend/dist/mapbox-gl-legend.css';
	import {
		CENTER,
		MAPBOX_DEFAULTS,
		MAPBOX_FIELDS,
		STYLE_URL,
		TARGETS,
		ZOOM,
		optionsToSearchParams,
		searchParamsToOptions,
		toLegendOptions,
		type MapboxDemoOptions
	} from '#lib/demo.js';
	import OptionsPanel from '#lib/OptionsPanel.svelte';
	import DemoNotice from '#lib/DemoNotice.svelte';

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;
	let control: MapboxLegendControl | undefined;
	let loaded = $state(false);

	// options are read from the URL, so that a configured demo can be shared
	let options: MapboxDemoOptions = $state(
		searchParamsToOptions(page.url.searchParams, MAPBOX_DEFAULTS)
	);

	const hasToken = !!PUBLIC_MAPBOX_ACCESSTOKEN;

	onMount(() => {
		if (!mapContainer) return;
		if (!hasToken) return;
		mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESSTOKEN;

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
		const legendOptions = toLegendOptions(options);
		untrack(() => {
			if (!map) return;
			if (control) map.removeControl(control);
			control = new MapboxLegendControl(targets, legendOptions);
			map.addControl(control, 'top-right');
			// the control draws the legend on 'idle', which is not fired again on a loaded map
			if (map.loaded()) control.redraw();

			// keep the map position in the hash
			const query = optionsToSearchParams(options, MAPBOX_DEFAULTS).toString();
			const href = `${resolve('/mapbox')}${query ? `?${query}` : ''}${window.location.hash}`;
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
	{#if hasToken}
		<OptionsPanel bind:options defaults={MAPBOX_DEFAULTS} fields={MAPBOX_FIELDS} />
	{/if}
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
