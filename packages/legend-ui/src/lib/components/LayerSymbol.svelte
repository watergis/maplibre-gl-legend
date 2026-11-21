<!--
@component
The legend symbol of a layer, drawn by the legend source (an SVG element), or a fallback icon when
it could not be drawn.
-->
<script lang="ts">
	import type { LayerSymbol } from '../types/legend-source';

	interface Props {
		symbol: LayerSymbol;
	}

	let { symbol }: Props = $props();
</script>

{#if symbol.type === 'single'}
	<span
		class="maplibregl-legend-symbol"
		{@attach (span) => {
			span.replaceChildren(symbol.svg);
		}}
	></span>
{:else if symbol.type === 'error'}
	<span class="maplibregl-legend-symbol">
		<svg
			class="post-icon"
			fill="none"
			viewBox="0 0 24 24"
			stroke="black"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			aria-hidden="true"
		>
			<path
				d="M21,0H3A3,3,0,0,0,0,3V21a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V3A3,3,0,0,0,21,0ZM3,2H21a1,1,0,0,1,1,1V15.86L14.18,9.35a5.06,5.06,0,0,0-6.39-.06L2,13.92V3A1,1,0,0,1,3,2ZM21,22H3a1,1,0,0,1-1-1V16.48l7-5.63a3.06,3.06,0,0,1,3.86,0L22,18.47V21A1,1,0,0,1,21,22Z"
			/>
			<path d="M18,9a3,3,0,1,0-3-3A3,3,0,0,0,18,9Zm0-4a1,1,0,1,1-1,1A1,1,0,0,1,18,5Z" />
		</svg>
	</span>
{/if}
