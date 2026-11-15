<script lang="ts">
	import { resolve } from '$app/paths';
	import EmbeddedSite from '#lib/EmbeddedSite.svelte';
</script>

<!-- the TypeDoc site of all packages, written to static/docs/ by `pnpm build:docs` at the root -->
<EmbeddedSite title="API reference" src="{resolve('/')}docs/index.html" />
