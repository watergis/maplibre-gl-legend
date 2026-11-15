<!--
	A MapLibre map with the style of a story (see `layer-stories.ts`), and the style editor opened
	for the layer of the story, as maplibre-gl-legend opens it. The button at the bottom opens the
	editor again once it has been closed.
-->
<script lang="ts">
	import { Map, setWorkerUrl } from 'maplibre-gl';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { StyleEditorPosition } from '../lib/interfaces';
	import StyleEditorDialog from '../lib/style-editor-dialog';
	import { addStoryImages, addStoryProtocols, type LayerStory } from './layer-stories';

	// the worker is not found once Vite has pre-bundled maplibre-gl
	setWorkerUrl(workerUrl);

	interface Props {
		story: LayerStory;
		position?: StyleEditorPosition;
		onChange?: (layerId: string) => void;
		onClose?: () => void;
		/** a map smaller than the window (CSS sizes), to see that the dialog stays in the map */
		size?: { width: string; height: string };
	}

	let { story, position = 'top-left', onChange, onClose, size }: Props = $props();

	let editor: StyleEditorDialog | undefined;
	let open = $state(false);

	const show = () => {
		editor?.open({ layerId: story.layerId, title: story.title });
		open = true;
	};

	const attach = (container: HTMLDivElement) => {
		addStoryProtocols();
		const map = new Map({
			container,
			// a plain copy: the args of the stories are proxies
			style: JSON.parse(JSON.stringify(story.style)),
			center: story.center ?? [0, -0.05],
			zoom: story.zoom ?? 11,
			pitch: story.pitch ?? 0
		});
		addStoryImages(map);
		editor = new StyleEditorDialog({
			map,
			position,
			container,
			onChange,
			onClose: () => {
				open = false;
				onClose?.();
			}
		});
		map.once('load', show);
		return () => {
			editor?.close();
			map.remove();
		};
	};
</script>

<div
	class={['story-map', size && 'story-map--small']}
	style:width={size?.width}
	style:height={size?.height}
	{@attach attach}
></div>
{#if !open}
	<button type="button" class="story-map__open" onclick={show}>Open the style editor</button>
{/if}

<style>
	.story-map {
		position: relative;
		width: 100vw;
		height: 100vh;
	}

	.story-map--small {
		margin: 60px auto;
		outline: 2px dashed #94a3b8;
	}

	.story-map__open {
		position: absolute;
		bottom: 24px;
		left: 50%;
		padding: 8px 14px;
		border: none;
		border-radius: 8px;
		background: #4f46e5;
		color: #fff;
		font:
			14px system-ui,
			sans-serif;
		cursor: pointer;
		transform: translateX(-50%);
	}
</style>
